from flask import Flask, request, jsonify
from flask_cors import CORS
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

app = Flask(__name__)
CORS(app)

# CONFIGURATION
# To make this work, you need to:
# 1. Use a Gmail account
# 2. Enable 2-Step Verification
# 3. Create an "App Password" (https://myaccount.google.com/apppasswords)
GMAIL_USER = "YOUR_GMAIL@gmail.com"
GMAIL_APP_PASSWORD = "YOUR_APP_PASSWORD"

@app.route('/send-otp', methods=['POST'])
def send_otp():
    data = request.json
    email = data.get('email')
    code = data.get('code')
    name = data.get('name', 'User')

    if not email or not code:
        return jsonify({"error": "Missing email or code"}), 400

    if GMAIL_USER == "YOUR_GMAIL@gmail.com":
        print(f"[OFFLINE] Would send OTP {code} to {email}")
        return jsonify({"success": True, "message": "Demo mode: Email logged to server console."})

    try:
        msg = MIMEMultipart()
        msg['From'] = GMAIL_USER
        msg['To'] = email
        msg['Subject'] = f"{code} is your Smart Calc verification code"

        body = f"""
        <html>
        <body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
            <div style="max-width: 400px; margin: 0 auto; background-color: #1e293b; padding: 40px; border-radius: 24px; border: 1px solid #334155;">
                <h1 style="color: #3b82f6; margin-bottom: 24px;">Smart Calc</h1>
                <p style="font-size: 16px; margin-bottom: 32px;">Hello {name},</p>
                <p style="font-size: 14px; color: #94a3b8; margin-bottom: 8px;">Your verification code is:</p>
                <div style="font-size: 42px; font-weight: 800; letter-spacing: 8px; color: #ffffff; margin-bottom: 32px;">{code}</div>
                <p style="font-size: 12px; color: #64748b;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            </div>
        </body>
        </html>
        """
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        text = msg.as_string()
        server.sendmail(GMAIL_USER, email, text)
        server.quit()

        return jsonify({"success": True, "message": "OTP sent successfully!"})
    except Exception as e:
        print(f"Error sending email: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000, debug=True)
