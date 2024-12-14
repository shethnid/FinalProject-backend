from rest_framework import serializers
from .models import Document, Analysis, Conversation

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'uploaded_at']

class AnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Analysis
        fields = ['id', 'document', 'fee_perspective_analysis', 'created_at']

class ConversationSerializer(serializers.ModelSerializer):
    context_type = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id', 
            'document', 
            'message', 
            'is_fee', 
            'timestamp',
            'conversation_id',
            'context_type',
            'parent_message'
        ]
    
    def get_context_type(self, obj):
        return 'document' if obj.document else 'general'

class DocumentDetailSerializer(serializers.ModelSerializer):
    analyses = AnalysisSerializer(many=True, read_only=True)
    conversations = ConversationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 
            'title', 
            'file', 
            'uploaded_at', 
            'analyses', 
            'conversations'
        ]

class ConversationThreadSerializer(serializers.ModelSerializer):
    responses = ConversationSerializer(many=True, read_only=True)
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'document',
            'message',
            'is_fee',
            'timestamp',
            'conversation_id',
            'responses'
        ]

class ConversationListSerializer(serializers.ModelSerializer):
    document_title = serializers.SerializerMethodField()
    
    class Meta:
        model = Conversation
        fields = [
            'id',
            'document',
            'document_title',
            'message',
            'is_fee',
            'timestamp',
            'conversation_id'
        ]
    
    def get_document_title(self, obj):
        return obj.document.title if obj.document else None