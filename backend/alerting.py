import os
from twilio.rest import Client
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import requests
from dotenv import load_dotenv

load_dotenv()

class AlertingSystem:
    """Multi-channel alerting system"""
    
    def __init__(self):
        # Email (SendGrid)
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        self.from_email = os.getenv('FROM_EMAIL', 'alerts@campus-network.com')
        
        # SMS (Twilio)
        self.twilio_account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.twilio_auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.twilio_phone = os.getenv('TWILIO_PHONE')
        
        # Webhooks
        self.slack_webhook = os.getenv('SLACK_WEBHOOK_URL')
        self.discord_webhook = os.getenv('DISCORD_WEBHOOK_URL')
        self.teams_webhook = os.getenv('TEAMS_WEBHOOK_URL')
        
        # PagerDuty
        self.pagerduty_routing_key = os.getenv('PAGERDUTY_ROUTING_KEY')
    
    def send_email(self, to_email, subject, body):
        """Send email alert via SendGrid"""
        if not self.sendgrid_api_key:
            print("⚠️  SendGrid API key not configured")
            return False
        
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=body
            )
            
            sg = SendGridAPIClient(self.sendgrid_api_key)
            response = sg.send(message)
            
            print(f"✅ Email sent to {to_email}")
            return True
        except Exception as e:
            print(f"❌ Email error: {e}")
            return False
    
    def send_sms(self, to_phone, message):
        """Send SMS alert via Twilio"""
        if not self.twilio_account_sid or not self.twilio_auth_token:
            print("⚠️  Twilio credentials not configured")
            return False
        
        try:
            client = Client(self.twilio_account_sid, self.twilio_auth_token)
            
            message = client.messages.create(
                body=message,
                from_=self.twilio_phone,
                to=to_phone
            )
            
            print(f"✅ SMS sent to {to_phone}")
            return True
        except Exception as e:
            print(f"❌ SMS error: {e}")
            return False
    
    def send_pagerduty_alert(self, title, severity='info', details=None):
        """Send incident to PagerDuty via Events API v2"""
        if not self.pagerduty_routing_key:
            print("⚠️  PagerDuty routing key not configured")
            return False
        payload = {
            "routing_key": self.pagerduty_routing_key,
            "event_action": "trigger",
            "payload": {
                "summary": title,
                "severity": severity.lower(),
                "source": "campus-network-monitor",
            }
        }
        if details:
            payload['payload']['custom_details'] = details
        try:
            resp = requests.post('https://events.pagerduty.com/v2/enqueue', json=payload)
            if resp.status_code == 202:
                print("✅ PagerDuty incident created")
                return True
            else:
                print(f"❌ PagerDuty error: {resp.status_code} {resp.text}")
                return False
        except Exception as e:
            print(f"❌ PagerDuty exception: {e}")
            return False

    def send_slack_alert(self, message, severity='info'):
        """Send alert to Slack"""
        if not self.slack_webhook:
            print("⚠️  Slack webhook not configured")
            return False
        
        colors = {
            'critical': '#dc2626',
            'high': '#f97316',
            'medium': '#eab308',
            'low': '#3b82f6',
            'info': '#6366f1'
        }
        
        payload = {
            'attachments': [{
                'color': colors.get(severity.lower(), '#6366f1'),
                'title': f'🚨 Network Alert - {severity.upper()}',
                'text': message,
                'footer': 'Campus Network Monitor',
                'ts': int(time.time())
            }]
        }
        
        try:
            response = requests.post(self.slack_webhook, json=payload)
            if response.status_code == 200:
                print("✅ Slack alert sent")
                return True
            else:
                print(f"❌ Slack error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Slack error: {e}")
            return False
    
    def send_discord_alert(self, message, severity='info'):
        """Send alert to Discord"""
        if not self.discord_webhook:
            print("⚠️  Discord webhook not configured")
            return False
        
        colors = {
            'critical': 14423100,  # Red
            'high': 16744272,      # Orange
            'medium': 15258703,    # Yellow
            'low': 3447003,        # Blue
            'info': 6571263        # Purple
        }
        
        payload = {
            'embeds': [{
                'title': f'🚨 Network Alert',
                'description': message,
                'color': colors.get(severity.lower(), 6571263),
                'footer': {'text': 'Campus Network Monitor'},
                'timestamp': datetime.now().isoformat()
            }]
        }
        
        try:
            response = requests.post(self.discord_webhook, json=payload)
            if response.status_code == 204:
                print("✅ Discord alert sent")
                return True
            else:
                print(f"❌ Discord error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Discord error: {e}")
            return False
    
    def send_teams_alert(self, message, severity='info'):
        """Send alert to Microsoft Teams"""
        if not self.teams_webhook:
            print("⚠️  Teams webhook not configured")
            return False
        
        colors = {
            'critical': 'attention',
            'high': 'attention',
            'medium': 'warning',
            'low': 'good',
            'info': 'accent'
        }
        
        payload = {
            '@type': 'MessageCard',
            '@context': 'https://schema.org/extensions',
            'summary': 'Network Alert',
            'themeColor': colors.get(severity.lower(), 'accent'),
            'title': f'🚨 Network Alert - {severity.upper()}',
            'text': message
        }
        
        try:
            response = requests.post(self.teams_webhook, json=payload)
            if response.status_code == 200:
                print("✅ Teams alert sent")
                return True
            else:
                print(f"❌ Teams error: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Teams error: {e}")
            return False
    
    def send_alert(self, device_name, severity, description, channels=['slack']):
        """Send alert through multiple channels"""
        message = f"Device: {device_name}\nSeverity: {severity}\nDescription: {description}"
        
        results = {}
        
        for channel in channels:
            if channel == 'email':
                # Get admin emails from database
                results['email'] = self.send_email('admin@campus.net', 
                                                  f'Network Alert: {device_name}', 
                                                  f'<h2>{severity}</h2><p>{description}</p>')
            elif channel == 'sms':
                results['sms'] = self.send_sms('+1234567890', message[:160])
            elif channel == 'slack':
                results['slack'] = self.send_slack_alert(message, severity)
            elif channel == 'discord':
                results['discord'] = self.send_discord_alert(message, severity)
            elif channel == 'teams':
                results['teams'] = self.send_teams_alert(message, severity)
            elif channel == 'pagerduty':
                results['pagerduty'] = self.send_pagerduty_alert(
                    f"{severity} alert: {device_name}",
                    severity.lower(),
                    {"description": description}
                )
        
        return results