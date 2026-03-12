from flask_mail import Message
from app import mail


def send_reminder_email(student_email: str, student_name: str, deadline: str):
    msg = Message(
        subject='Action Required: Co-op Term Report Overdue',
        recipients=[student_email],
        body=(
            f'Hi {student_name},\n\n'
            f'Your co-op term report was due on {deadline} and has not yet been submitted.\n'
            f'Please log in and submit your report at your earliest convenience.\n\n'
            f'Co-op Program Office\nToronto Metropolitan University'
        )
    )
    mail.send(msg)


def send_welcome_email(student_email: str, student_name: str, temp_password: str):
    msg = Message(
        subject='Welcome to the Co-op Program — Next Steps',
        recipients=[student_email],
        body=(
            f'Hi {student_name},\n\n'
            f'Congratulations! Your application to the TMU Co-op Program has been provisionally accepted.\n\n'
            f'Your login credentials:\n'
            f'  Email: {student_email}\n'
            f'  Temporary Password: {temp_password}\n\n'
            f'Please log in and change your password as soon as possible.\n\n'
            f'Co-op Program Office\nToronto Metropolitan University'
        )
    )
    mail.send(msg)
