# Thryve
Thryve is a bi-directional mHealth ecosystem designed to unify maternal recovery across all 16 regions of Ghana. By linking mothers to healthcare facilities in real-time, Thryve addresses the critical systemic gaps in postnatal care, focusing on early detection of sepsis, anemia, and Postpartum Depression (PPD).
Maternal mortality remains a challenge due to the "Third Delay": the gap between a mother reaching a facility (or needing one) and receiving timely, appropriate care. Traditional paper-based systems and asynchronous SMS tools lack the urgency required for life-threatening postnatal complications.

## The Solution
Thryve consists of two integrated modules:

Thryve Mobile (Mother’s App): A PWA for self-assessment, localized AI voice-bot screening, and nutritional tracking.

TSA (Thryve Systems Analytics): A high-tier clinical dashboard for GHS hospitals featuring real-time triage and an automated 30-minute escalation engine.

### Key Features
Ghana Card Integration: Seamless onboarding using the National Identification Authority (NIA) API for unique patient tracking.

Localized AI Voice-Bot: PPD screening (EPDS) conducted in Twi and Hausa to bypass literacy barriers.

"Smart Plate" Tracker: Gamified nutritional monitoring with rules-based logic for anemia risk detection.

Real-time Triage (WebSockets): Instant "Red Flag" alerts sent to clinicians the moment a complication is logged.

30-Minute Escalation: Automated rerouting of alerts to District Community Health Officers (CHOs) if facility response is delayed.

### Tech Stack
Frontend: Next.js (PWA for Mothers), React.js (Clinician Dashboard)

Styling: Tailwind CSS (Theme: Baby Pink, Baby Blue, & White)

Backend: Node.js / Firebase Edge Functions

Database: Firebase

Real-time: WebSockets

Voice/AI: WebRTC for browser-based recording + OpenAI API for sentiment analysis

#### Figma Designs
https://www.figma.com/design/0x3eVfOzYTzqDmy4yiiBB6/Untitled?node-id=0-1&t=xA6btFXPMnsOIZlh-1 

#### Figma designs walkthrough
https://drive.google.com/drive/folders/1vcMV3EkcKF6X9ZW-gijzU6eCLTcFM7zt?usp=drive_link 
