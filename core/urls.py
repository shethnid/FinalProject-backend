from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DocumentViewSet, AnalysisViewSet, ConversationViewSet

router = DefaultRouter()
router.register(r'documents', DocumentViewSet)
router.register(r'analyses', AnalysisViewSet)
router.register(r'conversations', ConversationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    # direct chat endpoint
    path('chat/', DocumentViewSet.as_view({'post': 'chat_without_document'}), name='chat-without-document'),
]