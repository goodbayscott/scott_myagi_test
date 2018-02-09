from django.conf import settings

from django.core.mail import mail_admins

from celery import shared_task

from post_office import mail


@shared_task
def mail_admins_async(subject, message, fail_silently=False):
    """
    Use this to send email to the admins via celery.
    """
    if settings.SEND_MAIL:
        mail_admins(subject=subject,message=message,fail_silently=fail_silently)


@shared_task
def send_mail_async(recipients, sender=None, subject="", message="", priority="now", tags=None, headers=None):
    """
    Use this to send email via celery.
    """
    if recipients == None:
        recipients = []
    if headers == None:
        headers = {}
    if tags:
        kwargs['headers'] = {'X-Mailgun-Tag': tags}
    if settings.SEND_MAIL:
        return mail.send(
            recipients=recipients,
            subject=subject,
            message=message,
            headers=headers
        )
