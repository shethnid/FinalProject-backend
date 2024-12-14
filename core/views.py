from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.core.exceptions import ObjectDoesNotExist
import logging
from .models import Document, Analysis, Conversation
from .serializers import (
    DocumentSerializer, 
    AnalysisSerializer, 
    ConversationSerializer,
    DocumentDetailSerializer
)
from .fee_analyzer.analyzer import FeeAnalyzer

logger = logging.getLogger(__name__)

class AnalysisViewSet(viewsets.ModelViewSet):
    queryset = Analysis.objects.all()
    serializer_class = AnalysisSerializer

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in analysis list: {str(e)}")
            return Response(
                {"error": "Failed to retrieve analyses"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ConversationViewSet(viewsets.ModelViewSet):
    queryset = Conversation.objects.all()
    serializer_class = ConversationSerializer

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in conversation list: {str(e)}")
            return Response(
                {"error": "Failed to retrieve conversations"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return DocumentDetailSerializer
        return DocumentSerializer

    def list(self, request, *args, **kwargs):
        try:
            queryset = self.filter_queryset(self.get_queryset())
            page = self.paginate_queryset(queryset)
            
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                logger.info(f"Returning {len(serializer.data)} paginated documents")
                return self.get_paginated_response(serializer.data)

            serializer = self.get_serializer(queryset, many=True)
            logger.info(f"Returning {len(serializer.data)} documents (unpaginated)")
            return Response(serializer.data)
            
        except Exception as e:
            logger.error(f"Error in document list: {str(e)}")
            return Response(
                {"error": "Failed to retrieve documents"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def analyze(self, request, pk=None):
        """Analyze a document from Fee's perspective"""
        try:
            document = self.get_object()
            analyzer = FeeAnalyzer()
            
            logger.info(f"Starting analysis for document {document.id}: {document.title}")
            
            if not document.file:
                logger.error(f"No file found for document {document.id}")
                return Response(
                    {"error": "No file associated with this document"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            document.file.seek(0)
            
            # Check for existing analysis
            existing_analysis = Analysis.objects.filter(document=document).first()
            if existing_analysis:
                logger.info(f"Returning existing analysis for document {document.id}")
                return Response({
                    "message": "Analysis already exists",
                    "fee_perspective_analysis": existing_analysis.fee_perspective_analysis
                })
            
            # Perform new analysis
            logger.info(f"Performing new analysis for document {document.id}")
            analysis_result = analyzer.analyze_document(document.file)
            
            analysis = Analysis.objects.create(
                document=document,
                fee_perspective_analysis=analysis_result
            )
            
            logger.info(f"Analysis completed for document {document.id}")
            return Response({
                "fee_perspective_analysis": analysis_result
            }, status=status.HTTP_201_CREATED)
            
        except ObjectDoesNotExist:
            logger.error(f"Document {pk} not found")
            return Response(
                {"error": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in analyze endpoint: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def chat_without_document(self, request):
        """Chat with Fee without document context"""
        try:
            message = request.data.get('message')
            
            if not message or not message.strip():
                return Response(
                    {"error": "Message cannot be empty"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save user message
            user_message = Conversation.objects.create(
                document=None,
                message=message.strip(),
                is_fee=False
            )

            try:
                # Get Fee's response for general chat
                analyzer = FeeAnalyzer()
                fee_response = analyzer.get_fee_chat_response(
                    user_message=message,
                    analysis_context=None,
                    conversation_history=None
                )

                # Save Fee's response
                fee_message = Conversation.objects.create(
                    document=None,
                    message=fee_response,
                    is_fee=True
                )

                return Response({
                    'conversation': [
                        ConversationSerializer(user_message).data,
                        ConversationSerializer(fee_message).data
                    ]
                })

            except Exception as e:
                user_message.delete()  # Clean up user message if Fee's response fails
                raise e

        except Exception as e:
            logger.error(f"Error in chat without document: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def chat(self, request, pk=None):
        """Chat with Fee about a document"""
        try:
            message = request.data.get('message')
            
            if not message or not message.strip():
                return Response(
                    {"error": "Message cannot be empty"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get document and analysis if pk is provided
            document = None
            analysis = None
            if pk:
                try:
                    document = self.get_object()
                    analysis = Analysis.objects.filter(document=document).latest('created_at')
                except (ObjectDoesNotExist, Analysis.DoesNotExist):
                    return Response(
                        {"error": "Document must be analyzed before chatting"}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # Save user message
            user_message = Conversation.objects.create(
                document=document,
                message=message.strip(),
                is_fee=False
            )

            try:
                # Get conversation history
                conversation_history = []
                if document:
                    conversation_history = Conversation.objects.filter(
                        document=document
                    ).order_by('-timestamp')[:5]

                # Get Fee's response
                analyzer = FeeAnalyzer()
                fee_response = analyzer.get_fee_chat_response(
                    user_message=message,
                    analysis_context=analysis.fee_perspective_analysis if analysis else None,
                    conversation_history=list(conversation_history.values('message', 'is_fee'))
                )

                # Save Fee's response
                fee_message = Conversation.objects.create(
                    document=document,
                    message=fee_response,
                    is_fee=True
                )

                return Response({
                    'conversation': [
                        ConversationSerializer(user_message).data,
                        ConversationSerializer(fee_message).data
                    ]
                })

            except Exception as e:
                user_message.delete()  # Clean up user message if Fee's response fails
                raise e

        except Exception as e:
            logger.error(f"Error in chat endpoint: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def conversations(self, request, pk=None):
        """Get all conversations for a document"""
        try:
            document = self.get_object()
            conversations = Conversation.objects.filter(document=document)
            serializer = ConversationSerializer(conversations, many=True)
            
            logger.info(f"Returning {len(serializer.data)} conversations for document {document.id}")
            return Response(serializer.data)
            
        except ObjectDoesNotExist:
            logger.error(f"Document {pk} not found")
            return Response(
                {"error": "Document not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error retrieving conversations: {str(e)}")
            return Response(
                {"error": "Failed to retrieve conversations"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )