from django.contrib import admin
from .models import Document, Analysis, Conversation

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'uploaded_at')
    search_fields = ('title',)
    list_filter = ('uploaded_at',)
    readonly_fields = ('uploaded_at',)

@admin.register(Analysis)
class AnalysisAdmin(admin.ModelAdmin):
    list_display = ('document', 'created_at')
    search_fields = ('document__title',)
    list_filter = ('created_at',)
    readonly_fields = ('created_at',)

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('document', 'fee_perspective_analysis')
        return self.readonly_fields

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = (
        'conversation_context',
        'is_fee',
        'short_message',
        'timestamp'
    )
    list_filter = ('is_fee', 'timestamp', ('document', admin.EmptyFieldListFilter))  # Fixed this line
    search_fields = ('message', 'document__title', 'conversation_id')
    readonly_fields = ('timestamp',)
    raw_id_fields = ('document', 'parent_message')

    def conversation_context(self, obj):
        return f"Document: {obj.document.title}" if obj.document else "General Chat"
    conversation_context.short_description = "Context"

    def short_message(self, obj):
        return (obj.message[:50] + '...') if len(obj.message) > 50 else obj.message
    short_message.short_description = "Message"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('document')

    def get_readonly_fields(self, request, obj=None):
        if obj:  # Editing an existing object
            return self.readonly_fields + ('is_fee', 'conversation_id')
        return self.readonly_fields

    fieldsets = (
        (None, {
            'fields': ('message', 'is_fee')
        }),
        ('Context', {
            'fields': ('document', 'parent_message', 'conversation_id')
        }),
        ('Metadata', {
            'fields': ('timestamp',),
            'classes': ('collapse',)
        })
    )