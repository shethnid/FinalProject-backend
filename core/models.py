from django.db import models

class Document(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.title

class Analysis(models.Model):
    document = models.ForeignKey(Document, related_name='analyses', on_delete=models.CASCADE)
    fee_perspective_analysis = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis of {self.document.title}"

class Conversation(models.Model):
    document = models.ForeignKey(
        Document, 
        related_name='conversations', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True
    )
    message = models.TextField()
    is_fee = models.BooleanField()  # True if Fee's response, False if user message
    timestamp = models.DateTimeField(auto_now_add=True)
    
    # New fields to support better conversation tracking
    parent_message = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='responses'
    )
    conversation_id = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        db_index=True,
        help_text="UUID to group related messages"
    )

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        context = f"for {self.document.title}" if self.document else "without document"
        return f"{'Fee' if self.is_fee else 'User'} message {context}"