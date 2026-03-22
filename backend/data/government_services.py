"""
JanVaani — Government Services Database
Curated database of official Indian government services with:
- Official .gov.in URLs
- Step-by-step application procedures
- Required documents
- Helpline numbers
- YouTube search keywords per language
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

LanguageCode = Literal["en", "hi", "ta", "te", "bn", "mr", "gu", "kn", "ml"]


@dataclass
class InteractiveStep:
    """A single step in the interactive walkthrough."""
    step_number: int
    title: str
    title_hi: str
    title_ta: str
    description: str
    description_hi: str
    description_ta: str
    # Simulated browser state
    page_title: str
    page_url: str
    # What to highlight/click (CSS selector simulation)
    highlight_element: str
    action_type: Literal["click", "type", "select", "scroll", "wait"] = "click"
    # For type actions
    input_value: str = ""


@dataclass
class GovernmentService:
    """Represents a government service."""
    id: str
    name: str
    name_hi: str
    name_ta: str
    category: str
    # Official source
    official_url: str
    department: str
    # Application procedure
    steps: list[str]
    steps_hi: list[str]
    steps_ta: list[str]
    # Required documents
    required_documents: list[str]
    required_documents_hi: list[str]
    required_documents_ta: list[str]
    # Eligibility
    eligibility: str
    eligibility_hi: str
    eligibility_ta: str
    # Contact
    helpline: str
    email: str
    # YouTube search keywords per language
    youtube_keywords: dict[LanguageCode, str]
    # Interactive walkthrough steps
    interactive_steps: list[InteractiveStep] = field(default_factory=list)
    # Processing time
    processing_time: str = "7-15 days"
    processing_time_hi: str = "7-15 दिन"
    processing_time_ta: str = "7-15 நாட்கள்"
    # Fees
    fees: str = "Free"
    fees_hi: str = "निःशुल्क"
    fees_ta: str = "இலவசம்"


# ─── Interactive Walkthrough Templates ─────────────────────────────────

AADHAAR_WALKTHROUGH = [
    InteractiveStep(
        step_number=1,
        title="Visit UIDAI Website",
        title_hi="UIDAI वेबसाइट पर जाएं",
        title_ta="UIDAI இணையதளத்திற்குச் செல்லவும்",
        description="We'll navigate to the official UIDAI website",
        description_hi="हम आधिकारिक UIDAI वेबसाइट पर जाएंगे",
        description_ta="நாம் அதிகாரப்பூர்வ UIDAI இணையதளத்திற்குச் செல்வோம்",
        page_title="UIDAI - Unique Identification Authority of India",
        page_url="https://uidai.gov.in",
        highlight_element="body",
        action_type="wait",
    ),
    InteractiveStep(
        step_number=2,
        title="Click on Aadhaar Services",
        title_hi="आधार सेवाओं पर क्लिक करें",
        title_ta="ஆதார் சேவைகள் மீது கிளிக் செய்யவும்",
        description="Find and click the 'My Aadhaar' menu",
        description_hi="'My Aadhaar' मेनू ढूंढें और क्लिक करें",
        description_ta="'My Aadhaar' மெனுவைக் கண்டுபிடித்து கிளிக் செய்யவும்",
        page_title="UIDAI - My Aadhaar",
        page_url="https://uidai.gov.in/my-aadhaar.html",
        highlight_element=".my-aadhaar-menu",
        action_type="click",
    ),
    InteractiveStep(
        step_number=3,
        title="Select Enrolment",
        title_hi="एनरोलमेंट चुनें",
        title_ta="பதிவு செய்யவும்",
        description="Click on 'Locate Enrolment Center' for new Aadhaar",
        description_hi="नए आधार के लिए 'Locate Enrolment Center' पर क्लिक करें",
        description_ta="புதிய ஆதாருக்கு 'Locate Enrolment Center' மீது கிளிக் செய்யவும்",
        page_title="Locate Enrolment Center",
        page_url="https://appointments.uidai.gov.in/easearch.aspx",
        highlight_element=".enrolment-link",
        action_type="click",
    ),
    InteractiveStep(
        step_number=4,
        title="Enter Your Location",
        title_hi="अपना स्थान दर्ज करें",
        title_ta="உங்கள் இடத்தை உள்ளிடவும்",
        description="Enter your state, city, and pincode",
        description_hi="अपना राज्य, शहर और पिनकोड दर्ज करें",
        description_ta="உங்கள் மாநிலம், நகரம் மற்றும் பின்கோடை உள்ளிடவும்",
        page_title="Find Enrolment Center",
        page_url="https://appointments.uidai.gov.in/easearch.aspx",
        highlight_element="#state-dropdown",
        action_type="select",
    ),
    InteractiveStep(
        step_number=5,
        title="Book Appointment",
        title_hi="अपॉइंटमेंट बुक करें",
        title_ta="சந்திப்பைப் பதிவு செய்யவும்",
        description="Select a convenient center and date",
        description_hi="सुविधाजनक केंद्र और तारीख चुनें",
        description_ta="வசதியான மையம் மற்றும் தேதியைத் தேர்ந்தெடுக்கவும்",
        page_title="Book Appointment",
        page_url="https://appointments.uidai.gov.in/",
        highlight_element=".book-appointment-btn",
        action_type="click",
    ),
]

RATION_CARD_WALKTHROUGH = [
    InteractiveStep(
        step_number=1,
        title="Visit Food Department Portal",
        title_hi="खाद्य विभाग पोर्टल पर जाएं",
        title_ta="உணவுத் துறை போர்ட்டலுக்குச் செல்லவும்",
        description="Navigate to your state's food and civil supplies portal",
        description_hi="अपने राज्य के खाद्य और नागरिक आपूर्ति पोर्टल पर जाएं",
        description_ta="உங்கள் மாநில உணவு மற்றும் குடிமை விநியோக போர்ட்டலுக்குச் செல்லவும்",
        page_title="Food & Civil Supplies Department",
        page_url="https://fcs.delhigovt.nic.in",
        highlight_element="body",
        action_type="wait",
    ),
    InteractiveStep(
        step_number=2,
        title="Click on Ration Card Services",
        title_hi="राशन कार्ड सेवाओं पर क्लिक करें",
        title_ta="ரேஷன் கார்டு சேவைகள் மீது கிளிக் செய்யவும்",
        description="Find the Ration Card section",
        description_hi="राशन कार्ड सेक्शन ढूंढें",
        description_ta="ரேஷன் கார்டு பிரிவைக் கண்டறியவும்",
        page_title="Ration Card Services",
        page_url="https://fcs.delhigovt.nic.in/ration-card",
        highlight_element=".ration-card-link",
        action_type="click",
    ),
    InteractiveStep(
        step_number=3,
        title="Select New Ration Card",
        title_hi="नया राशन कार्ड चुनें",
        title_ta="புதிய ரேஷன் கார்டு தேர்ந்தெடுக்கவும்",
        description="Click on 'Apply for New Ration Card'",
        description_hi="'नया राशन कार्ड के लिए आवेदन करें' पर क्लिक करें",
        description_ta="'புதிய ரேஷன் கார்டுக்கு விண்ணப்பிக்க' கிளிக் செய்யவும்",
        page_title="New Ration Card Application",
        page_url="https://fcs.delhigovt.nic.in/apply-new",
        highlight_element=".new-application-btn",
        action_type="click",
    ),
    InteractiveStep(
        step_number=4,
        title="Fill Family Details",
        title_hi="परिवार का विवरण भरें",
        title_ta="குடும்ப விவரங்களை நிரப்பவும்",
        description="Enter head of family name, members, and income",
        description_hi="परिवार के मुखिया का नाम, सदस्य और आय दर्ज करें",
        description_ta="குடும்பத் தலைவர் பெயர், உறுப்பினர்கள் மற்றும் வருமானத்தை உள்ளிடவும்",
        page_title="Application Form",
        page_url="https://fcs.delhigovt.nic.in/form",
        highlight_element="#family-details",
        action_type="type",
        input_value="Family details form",
    ),
    InteractiveStep(
        step_number=5,
        title="Upload Documents",
        title_hi="दस्तावेज़ अपलोड करें",
        title_ta="ஆவணங்களைப் பதிவேற்றவும்",
        description="Upload Aadhaar, income proof, and address proof",
        description_hi="आधार, आय प्रमाण और पता प्रमाण अपलोड करें",
        description_ta="ஆதார், வருமான சான்று மற்றும் முகவரி சான்றைப் பதிவேற்றவும்",
        page_title="Upload Documents",
        page_url="https://fcs.delhigovt.nic.in/upload",
        highlight_element=".upload-section",
        action_type="click",
    ),
    InteractiveStep(
        step_number=6,
        title="Submit Application",
        title_hi="आवेदन जमा करें",
        title_ta="விண்ணப்பத்தைச் சமர்ப்பிக்கவும்",
        description="Review and submit. Note your application number!",
        description_hi="समीक्षा करें और सबमिट करें। अपना आवेदन नंबर नोट करें!",
        description_ta="மறுபரிசீலனை செய்து சமர்ப்பிக்கவும். உங்கள் விண்ணப்ப எண்ணைக் குறித்துக்கொள்ளவும்!",
        page_title="Submit Application",
        page_url="https://fcs.delhigovt.nic.in/submit",
        highlight_element=".submit-btn",
        action_type="click",
    ),
]

PAN_WALKTHROUGH = [
    InteractiveStep(
        step_number=1,
        title="Visit NSDL PAN Portal",
        title_hi="NSDL PAN पोर्टल पर जाएं",
        title_ta="NSDL PAN போர்ட்டலுக்குச் செல்லவும்",
        description="Navigate to official NSDL PAN services",
        description_hi="आधिकारिक NSDL PAN सेवाओं पर जाएं",
        description_ta="அதிகாரப்பூர்வ NSDL PAN சேவைகளுக்குச் செல்லவும்",
        page_title="NSDL e-Gov - PAN Services",
        page_url="https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
        highlight_element="body",
        action_type="wait",
    ),
    InteractiveStep(
        step_number=2,
        title="Select New PAN Application",
        title_hi="नया PAN आवेदन चुनें",
        title_ta="புதிய PAN விண்ணப்பத்தைத் தேர்ந்தெடுக்கவும்",
        description="Click on 'New PAN - Indian Citizen'",
        description_hi="'New PAN - Indian Citizen' पर क्लिक करें",
        description_ta="'New PAN - Indian Citizen' மீது கிளிக் செய்யவும்",
        page_title="PAN Application Form",
        page_url="https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
        highlight_element=".new-pan-btn",
        action_type="click",
    ),
    InteractiveStep(
        step_number=3,
        title="Fill Personal Details",
        title_hi="व्यक्तिगत विवरण भरें",
        title_ta="தனிப்பட்ட விவரங்களை நிரப்பவும்",
        description="Enter name, father's name, date of birth",
        description_hi="नाम, पिता का नाम, जन्म तिथि दर्ज करें",
        description_ta="பெயர், தந்தை பெயர், பிறந்த தேதியை உள்ளிடவும்",
        page_title="PAN Form 49A",
        page_url="https://www.onlineservices.nsdl.com/paam/Form49A.html",
        highlight_element="#personal-details",
        action_type="type",
        input_value="Personal details",
    ),
    InteractiveStep(
        step_number=4,
        title="Submit and Pay",
        title_hi="सबमिट करें और भुगतान करें",
        title_ta="சமர்ப்பித்து கட்டணம் செலுத்தவும்",
        description="Pay ₹107 fee and get acknowledgment",
        description_hi="₹107 फीस का भुगतान करें और रसीद प्राप्त करें",
        description_ta="₹107 கட்டணம் செலுத்தி ரசீதைப் பெறவும்",
        page_title="Payment Page",
        page_url="https://www.onlineservices.nsdl.com/payment.html",
        highlight_element=".pay-btn",
        action_type="click",
    ),
]

VOTER_ID_WALKTHROUGH = [
    InteractiveStep(
        step_number=1,
        title="Visit Voter Helpline Portal",
        title_hi="वोटर हेल्पलाइन पोर्टल पर जाएं",
        title_ta="வாக்காளர் ஹெல்ப்லைன் போர்ட்டலுக்குச் செல்லவும்",
        description="Navigate to Election Commission's Voter Helpline",
        description_hi="चुनाव आयोग के वोटर हेल्पलाइन पर जाएं",
        description_ta="தேர்தல் ஆணையத்தின் வாக்காளர் ஹெல்ப்லைனுக்குச் செல்லவும்",
        page_title="Voter Helpline - Election Commission of India",
        page_url="https://voterhelpline.eci.gov.in",
        highlight_element="body",
        action_type="wait",
    ),
    InteractiveStep(
        step_number=2,
        title="Click on New Voter Registration",
        title_hi="नए वोटर पंजीकरण पर क्लिक करें",
        title_ta="புதிய வாக்காளர் பதிவில் கிளிக் செய்யவும்",
        description="Find and click 'Form 6 - New Voter'",
        description_hi="'Form 6 - New Voter' ढूंढें और क्लिक करें",
        description_ta="'Form 6 - New Voter' கண்டுபிடித்து கிளிக் செய்யவும்",
        page_title="Form 6 - New Voter Registration",
        page_url="https://voterhelpline.eci.gov.in/form6",
        highlight_element=".form6-link",
        action_type="click",
    ),
    InteractiveStep(
        step_number=3,
        title="Enter Assembly Constituency",
        title_hi="विधानसभा क्षेत्र दर्ज करें",
        title_ta="சட்டமன்றத் தொகுதியை உள்ளிடவும்",
        description="Select your state and assembly constituency",
        description_hi="अपना राज्य और विधानसभा क्षेत्र चुनें",
        description_ta="உங்கள் மாநிலம் மற்றும் சட்டமன்றத் தொகுதியைத் தேர்ந்தெடுக்கவும்",
        page_title="Select Constituency",
        page_url="https://voterhelpline.eci.gov.in/select-constituency",
        highlight_element="#state-select",
        action_type="select",
    ),
    InteractiveStep(
        step_number=4,
        title="Fill Form 6 Details",
        title_hi="फॉर्म 6 विवरण भरें",
        title_ta="வடிவம் 6 விவரங்களை நிரப்பவும்",
        description="Enter name, age, address, and family details",
        description_hi="नाम, आयु, पता और परिवार का विवरण दर्ज करें",
        description_ta="பெயர், வயது, முகவரி மற்றும் குடும்ப விவரங்களை உள்ளிடவும்",
        page_title="Form 6",
        page_url="https://voterhelpline.eci.gov.in/form6-fill",
        highlight_element="#form6-details",
        action_type="type",
        input_value="Form 6 details",
    ),
    InteractiveStep(
        step_number=5,
        title="Upload Photo and Documents",
        title_hi="फोटो और दस्तावेज़ अपलोड करें",
        title_ta="புகைப்படம் மற்றும் ஆவணங்களைப் பதிவேற்றவும்",
        description="Upload passport photo, age proof, address proof",
        description_hi="पासपोर्ट फोटो, आयु प्रमाण, पता प्रमाण अपलोड करें",
        description_ta="பாஸ்போர்ட் புகைப்படம், வயது சான்று, முகவரி சான்றைப் பதிவேற்றவும்",
        page_title="Upload Documents",
        page_url="https://voterhelpline.eci.gov.in/upload",
        highlight_element=".upload-area",
        action_type="click",
    ),
    InteractiveStep(
        step_number=6,
        title="Submit and Get Reference Number",
        title_hi="सबमिट करें और रेफरेंस नंबर प्राप्त करें",
        title_ta="சமர்ப்பித்து குறிப்பு எண்ணைப் பெறவும்",
        description="Submit form and save your reference number",
        description_hi="फॉर्म सबमिट करें और अपना रेफरेंस नंबर सेव करें",
        description_ta="வடிவத்தைச் சமர்ப்பித்து உங்கள் குறிப்பு எண்ணைச் சேமிக்கவும்",
        page_title="Submission Confirmation",
        page_url="https://voterhelpline.eci.gov.in/confirmation",
        highlight_element=".submit-btn",
        action_type="click",
    ),
]

PASSPORT_WALKTHROUGH = [
    InteractiveStep(
        step_number=1,
        title="Visit Passport Seva Portal",
        title_hi="पासपोर्ट सेवा पोर्टल पर जाएं",
        title_ta="பாஸ்போர்ட் சேவா போர்ட்டலுக்குச் செல்லவும்",
        description="Navigate to official Passport Seva",
        description_hi="आधिकारिक पासपोर्ट सेवा पर जाएं",
        description_ta="அதிகாரப்பூர்வ பாஸ்போர்ட் சேவாவுக்குச் செல்லவும்",
        page_title="Passport Seva - Ministry of External Affairs",
        page_url="https://www.passportindia.gov.in",
        highlight_element="body",
        action_type="wait",
    ),
    InteractiveStep(
        step_number=2,
        title="Register/Login",
        title_hi="रजिस्टर/लॉगिन करें",
        title_ta="பதிவு/உள்நுழையவும்",
        description="Create account or login if existing user",
        description_hi="खाता बनाएं या मौजूदा उपयोगकर्ता लॉगिन करें",
        description_ta="கணக்கு உருவாக்கவும் அல்லது ஏற்கனவே உள்ள பயனர் உள்நுழையவும்",
        page_title="Login/Register",
        page_url="https://www.passportindia.gov.in/AppOnlineProject/online/registration",
        highlight_element=".register-btn",
        action_type="click",
    ),
    InteractiveStep(
        step_number=3,
        title="Apply for Fresh Passport",
        title_hi="नया पासपोर्ट के लिए आवेदन करें",
        title_ta="புதிய பாஸ்போர்ட்டிற்கு விண்ணப்பிக்கவும்",
        description="Click on 'Apply for Fresh Passport/Booklet'",
        description_hi="'Apply for Fresh Passport/Booklet' पर क्लिक करें",
        description_ta="'Apply for Fresh Passport/Booklet' மீது கிளிக் செய்யவும்",
        page_title="Passport Application",
        page_url="https://www.passportindia.gov.in/AppOnlineProject/online/apply",
        highlight_element=".fresh-passport-btn",
        action_type="click",
    ),
    InteractiveStep(
        step_number=4,
        title="Fill Application Form",
        title_hi="आवेदन फॉर्म भरें",
        title_ta="விண்ணப்பப் படிவத்தை நிரப்பவும்",
        description="Enter personal, family, and address details",
        description_hi="व्यक्तिगत, परिवार और पता विवरण दर्ज करें",
        description_ta="தனிப்பட்ட, குடும்ப மற்றும் முகவரி விவரங்களை உள்ளிடவும்",
        page_title="Application Form",
        page_url="https://www.passportindia.gov.in/AppOnlineProject/online/formFill",
        highlight_element="#application-form",
        action_type="type",
        input_value="Application details",
    ),
    InteractiveStep(
        step_number=5,
        title="Pay Fees and Book Appointment",
        title_hi="फीस का भुगतान करें और अपॉइंटमेंट बुक करें",
        title_ta="கட்டணம் செலுத்தி சந்திப்பைப் பதிவு செய்யவும்",
        description="Pay passport fees and select PSK date",
        description_hi="पासपोर्ट फीस का भुगतान करें और PSK तारीख चुनें",
        description_ta="பாஸ்போர்ட் கட்டணம் செலுத்தி PSK தேதியைத் தேர்ந்தெடுக்கவும்",
        page_title="Payment & Appointment",
        page_url="https://www.passportindia.gov.in/AppOnlineProject/online/payment",
        highlight_element=".pay-book-btn",
        action_type="click",
    ),
]

PM_KISAN_WALKTHROUGH = [
    InteractiveStep(
        step_number=1,
        title="Visit PM Kisan Portal",
        title_hi="PM किसान पोर्टल पर जाएं",
        title_ta="PM கிசான் போர்ட்டலுக்குச் செல்லவும்",
        description="Navigate to official PM Kisan Samman Nidhi",
        description_hi="आधिकारिक PM किसान सम्मान निधि पर जाएं",
        description_ta="அதிகாரப்பூர்வ PM கிசான் சம்மான் நிதிக்குச் செல்லவும்",
        page_title="PM Kisan Samman Nidhi",
        page_url="https://pmkisan.gov.in",
        highlight_element="body",
        action_type="wait",
    ),
    InteractiveStep(
        step_number=2,
        title="Click on Farmer Corner",
        title_hi="किसान कॉर्नर पर क्लिक करें",
        title_ta="விவசாயி கார்னரில் கிளிக் செய்யவும்",
        description="Find and click 'New Farmer Registration'",
        description_hi="'New Farmer Registration' ढूंढें और क्लिक करें",
        description_ta="'New Farmer Registration' கண்டுபிடித்து கிளிக் செய்யவும்",
        page_title="Farmer Corner",
        page_url="https://pmkisan.gov.in/farmer-corner.aspx",
        highlight_element=".farmer-corner-link",
        action_type="click",
    ),
    InteractiveStep(
        step_number=3,
        title="Enter Aadhaar Number",
        title_hi="आधार नंबर दर्ज करें",
        title_ta="ஆதார் எண்ணை உள்ளிடவும்",
        description="Enter your Aadhaar number for authentication",
        description_hi="प्रमाणीकरण के लिए अपना आधार नंबर दर्ज करें",
        description_ta="அங்கீகாரத்திற்காக உங்கள் ஆதார் எண்ணை உள்ளிடவும்",
        page_title="Aadhaar Authentication",
        page_url="https://pmkisan.gov.in/aadhaar-auth.aspx",
        highlight_element="#aadhaar-input",
        action_type="type",
        input_value="XXXXXXXXXXXX",
    ),
    InteractiveStep(
        step_number=4,
        title="Fill Bank and Land Details",
        title_hi="बैंक और भूमि विवरण भरें",
        title_ta="வங்கி மற்றும் நில விவரங்களை நிரப்பவும்",
        description="Enter bank account and land ownership details",
        description_hi="बैंक खाता और भूमि स्वामित्व विवरण दर्ज करें",
        description_ta="வங்கி கணக்கு மற்றும் நில உரிமை விவரங்களை உள்ளிடவும்",
        page_title="Registration Form",
        page_url="https://pmkisan.gov.in/register.aspx",
        highlight_element="#registration-form",
        action_type="type",
        input_value="Bank and land details",
    ),
    InteractiveStep(
        step_number=5,
        title="Submit and Verify",
        title_hi="सबमिट करें और सत्यापित करें",
        title_ta="சமர்ப்பித்து சரிபார்க்கவும்",
        description="Submit for verification by local authorities",
        description_hi="स्थानीय अधिकारियों द्वारा सत्यापन के लिए सबमिट करें",
        description_ta="உள்ளூர் அதிகாரிகளால் சரிபார்ப்பதற்கு சமர்ப்பிக்கவும்",
        page_title="Submission",
        page_url="https://pmkisan.gov.in/submit.aspx",
        highlight_element=".submit-btn",
        action_type="click",
    ),
]

# ─── Complete Services Database ───────────────────────────────────────

GOVERNMENT_SERVICES: dict[str, GovernmentService] = {
    "aadhaar": GovernmentService(
        id="aadhaar",
        name="Aadhaar Card",
        name_hi="आधार कार्ड",
        name_ta="ஆதார் அட்டை",
        category="Identity",
        official_url="https://uidai.gov.in",
        department="UIDAI",
        steps=[
            "Visit nearest Aadhaar Enrolment Center",
            "Fill the Aadhaar Enrolment Form",
            "Submit biometric data (fingerprints, iris scan, photograph)",
            "Collect acknowledgment slip with Enrollment ID (EID)",
            "Download e-Aadhaar once processed (7-10 days)",
        ],
        steps_hi=[
            "निकटतम आधार एनरोलमेंट केंद्र पर जाएं",
            "आधार एनरोलमेंट फॉर्म भरें",
            "बायोमेट्रिक डेटा जमा करें (फिंगरप्रिंट, आइरिस स्कैन, फोटो)",
            "एनरोलमेंट आईडी (EID) के साथ स्वीकृति पर्ची एकत्र करें",
            "प्रोसेस होने के बाद ई-आधार डाउनलोड करें (7-10 दिन)",
        ],
        steps_ta=[
            "அருகிலுள்ள ஆதார் பதிவு மையத்திற்குச் செல்லவும்",
            "ஆதார் பதிவுப் படிவத்தை நிரப்பவும்",
            "உயிரியல் தரவைச் சமர்ப்பிக்கவும் (கைரேகைகள், ஐரிஸ் ஸ்கேன், புகைப்படம்)",
            "பதிவு எண் (EID) உடன் ஒப்புதல் சீட்டைப் பெறவும்",
            "செயலாக்கப்பட்ட பிறகு ஈ-ஆதாரைப் பதிவிறக்கவும் (7-10 நாட்கள்)",
        ],
        required_documents=["Proof of Identity", "Proof of Address", "Proof of Date of Birth"],
        required_documents_hi=["पहचान का प्रमाण", "पते का प्रमाण", "जन्म तिथि का प्रमाण"],
        required_documents_ta=["அடையாளச் சான்று", "முகவரிச் சான்று", "பிறந்த தேதிச் சான்று"],
        eligibility="All Indian residents including minors, NRIs, and OCI cardholders",
        eligibility_hi="सभी भारतीय निवासी जिनमें नाबालिग, NRI और OCI कार्डधारक शामिल हैं",
        eligibility_ta="அனைத்து இந்திய குடியிருப்பாளர்கள், சிறார்கள், NRIகள் மற்றும் OCI அட்டைதாரர்கள் உட்பட",
        helpline="1947",
        email="support@uidai.gov.in",
        youtube_keywords={
            "en": "how to apply aadhaar card online uidai",
            "hi": "आधार कार्ड ऑनलाइन कैसे बनाएं uidai",
            "ta": "ஆதார் அட்டை ஆன்லைனில் எப்படி செய்வது uidai",
            "te": "aadhaar card online apply telugu",
            "bn": "aadhaar card online kivabe korbe",
            "mr": "aadhaar card online kase banvayche",
            "gu": "aadhaar card online kaise banvay",
            "kn": "aadhaar card online apply kannada",
            "ml": "aadhaar card online ethre vidham",
        },
        interactive_steps=AADHAAR_WALKTHROUGH,
        processing_time="7-10 days",
        processing_time_hi="7-10 दिन",
        processing_time_ta="7-10 நாட்கள்",
        fees="Free",
        fees_hi="निःशुल्क",
        fees_ta="இலவசம்",
    ),
    "ration_card": GovernmentService(
        id="ration_card",
        name="Ration Card",
        name_hi="राशन कार्ड",
        name_ta="ரேஷன் கார்டு",
        category="Food & Supplies",
        official_url="https://fcs.delhigovt.nic.in",
        department="Food & Civil Supplies Department",
        steps=[
            "Visit your state's Food & Civil Supplies portal",
            "Click on 'Apply for New Ration Card'",
            "Fill family details (head, members, income)",
            "Upload required documents (Aadhaar, income proof, address proof)",
            "Submit application and note application number",
            "Track status online using application number",
        ],
        steps_hi=[
            "अपने राज्य के खाद्य और नागरिक आपूर्ति पोर्टल पर जाएं",
            "'नया राशन कार्ड के लिए आवेदन करें' पर क्लिक करें",
            "परिवार का विवरण भरें (मुखिया, सदस्य, आय)",
            "आवश्यक दस्तावेज़ अपलोड करें (आधार, आय प्रमाण, पता प्रमाण)",
            "आवेदन जमा करें और आवेदन संख्या नोट करें",
            "आवेदन संख्या का उपयोग करके ऑनलाइन स्थिति ट्रैक करें",
        ],
        steps_ta=[
            "உங்கள் மாநில உணவு மற்றும் குடிமை விநியோக போர்ட்டலுக்குச் செல்லவும்",
            "'புதிய ரேஷன் கார்டுக்கு விண்ணப்பிக்க' கிளிக் செய்யவும்",
            "குடும்ப விவரங்களை நிரப்பவும் (தலைவர், உறுப்பினர்கள், வருமானம்)",
            "தேவையான ஆவணங்களைப் பதிவேற்றவும் (ஆதார், வருமான சான்று, முகவரி சான்று)",
            "விண்ணப்பத்தைச் சமர்ப்பித்து விண்ணப்ப எண்ணைக் குறித்துக்கொள்ளவும்",
            "விண்ணப்ப எண்ணைப் பயன்படுத்தி ஆன்லைனில் நிலவரத்தைக் கண்காணிக்கவும்",
        ],
        required_documents=["Aadhaar Card of all family members", "Income Certificate", "Address Proof", "Passport Size Photos", "Self Declaration"],
        required_documents_hi=["सभी परिवार के सदस्यों का आधार कार्ड", "आय प्रमाणपत्र", "पता प्रमाण", "पासपोर्ट साइज फोटो", "स्वयं घोषणा"],
        required_documents_ta=["அனைத்து குடும்ப உறுப்பினர்களின் ஆதார் அட்டை", "வருமானச் சான்றிதழ்", "முகவரிச் சான்று", "பாஸ்போர்ட் அளவு புகைப்படங்கள்", "சுய அறிவிப்பு"],
        eligibility="All families residing in India. BPL families get priority.",
        eligibility_hi="भारत में रहने वाले सभी परिवार। BPL परिवारों को प्राथमिकता मिलती है।",
        eligibility_ta="இந்தியாவில் வசிக்கும் அனைத்து குடும்பங்களும். BPL குடும்பங்களுக்கு முன்னுரிமை உண்டு.",
        helpline="1967",
        email="fcs-delhi@gov.in",
        youtube_keywords={
            "en": "how to apply ration card online india",
            "hi": "राशन कार्ड ऑनलाइन कैसे बनाएं",
            "ta": "ரேஷன் கார்டு ஆன்லைனில் எப்படி செய்வது",
            "te": "ration card online apply telugu",
            "bn": "ration card online kivabe korbe",
            "mr": "ration card online kase banvayche",
            "gu": "ration card online kaise banvay",
            "kn": "ration card online apply kannada",
            "ml": "ration card online ethre vidham",
        },
        interactive_steps=RATION_CARD_WALKTHROUGH,
        processing_time="15-30 days",
        processing_time_hi="15-30 दिन",
        processing_time_ta="15-30 நாட்கள்",
        fees="Free",
        fees_hi="निःशुल्क",
        fees_ta="இலவசம்",
    ),
    "pan_card": GovernmentService(
        id="pan_card",
        name="PAN Card",
        name_hi="PAN कार्ड",
        name_ta="PAN அட்டை",
        category="Finance",
        official_url="https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html",
        department="Income Tax Department",
        steps=[
            "Visit NSDL PAN portal or UTIITSL portal",
            "Fill Form 49A (Indian citizens) or Form 49AA (Foreign citizens)",
            "Enter personal details (name, father's name, DOB)",
            "Upload photo and identity proof",
            "Pay ₹107 fee online",
            "Get acknowledgment number",
            "Receive PAN card in 15-20 days",
        ],
        steps_hi=[
            "NSDL PAN पोर्टल या UTIITSL पोर्टल पर जाएं",
            "फॉर्म 49A (भारतीय नागरिक) या फॉर्म 49AA (विदेशी नागरिक) भरें",
            "व्यक्तिगत विवरण दर्ज करें (नाम, पिता का नाम, जन्म तिथि)",
            "फोटो और पहचान प्रमाण अपलोड करें",
            "₹107 फीस ऑनलाइन जमा करें",
            "स्वीकृति संख्या प्राप्त करें",
            "15-20 दिनों में PAN कार्ड प्राप्त करें",
        ],
        steps_ta=[
            "NSDL PAN போர்ட்டல் அல்லது UTIITSL போர்ட்டலுக்குச் செல்லவும்",
            "வடிவம் 49A (இந்திய குடிமக்கள்) அல்லது வடிவம் 49AA (வெளிநாட்டு குடிமக்கள்) நிரப்பவும்",
            "தனிப்பட்ட விவரங்களை உள்ளிடவும் (பெயர், தந்தை பெயர், பிறந்த தேதி)",
            "புகைப்படம் மற்றும் அடையாளச் சான்றைப் பதிவேற்றவும்",
            "₹107 கட்டணத்தை ஆன்லைனில் செலுத்தவும்",
            "ஒப்புதல் எண்ணைப் பெறவும்",
            "15-20 நாட்களில் PAN அட்டையைப் பெறவும்",
        ],
        required_documents=["Proof of Identity", "Proof of Address", "Proof of Date of Birth", "Passport Size Photo"],
        required_documents_hi=["पहचान का प्रमाण", "पते का प्रमाण", "जन्म तिथि का प्रमाण", "पासपोर्ट साइज फोटो"],
        required_documents_ta=["அடையாளச் சான்று", "முகவரிச் சான்று", "பிறந்த தேதிச் சான்று", "பாஸ்போர்ட் அளவு புகைப்படம்"],
        eligibility="All Indian citizens, NRIs, and foreign entities earning in India",
        eligibility_hi="सभी भारतीय नागरिक, NRI, और भारत में कमाई करने वाली विदेशी संस्थाएं",
        eligibility_ta="அனைத்து இந்திய குடிமக்கள், NRIகள் மற்றும் இந்தியாவில் வருமானம் ஈட்டும் வெளிநாட்டு நிறுவனங்கள்",
        helpline="020-27218080",
        email="tininfo@nsdl.co.in",
        youtube_keywords={
            "en": "how to apply pan card online nsdl",
            "hi": "PAN कार्ड ऑनलाइन कैसे बनाएं nsdl",
            "ta": "PAN அட்டை ஆன்லைனில் எப்படி செய்வது nsdl",
            "te": "pan card online apply telugu nsdl",
            "bn": "pan card online kivabe korbe",
            "mr": "pan card online kase banvayche",
            "gu": "pan card online kaise banvay",
            "kn": "pan card online apply kannada",
            "ml": "pan card online ethre vidham",
        },
        interactive_steps=PAN_WALKTHROUGH,
        processing_time="15-20 days",
        processing_time_hi="15-20 दिन",
        processing_time_ta="15-20 நாட்கள்",
        fees="₹107",
        fees_hi="₹107",
        fees_ta="₹107",
    ),
    "voter_id": GovernmentService(
        id="voter_id",
        name="Voter ID (EPIC)",
        name_hi="वोटर आईडी (EPIC)",
        name_ta="வாக்காளர் அட்டை (EPIC)",
        category="Identity",
        official_url="https://voterhelpline.eci.gov.in",
        department="Election Commission of India",
        steps=[
            "Visit Voter Helpline Portal",
            "Click on 'Form 6 - New Voter Registration'",
            "Select your state and assembly constituency",
            "Fill personal details (name, age, address)",
            "Upload passport photo and documents",
            "Submit and get reference number",
            "Track application status",
        ],
        steps_hi=[
            "वोटर हेल्पलाइन पोर्टल पर जाएं",
            "'Form 6 - New Voter Registration' पर क्लिक करें",
            "अपना राज्य और विधानसभा क्षेत्र चुनें",
            "व्यक्तिगत विवरण भरें (नाम, आयु, पता)",
            "पासपोर्ट फोटो और दस्तावेज़ अपलोड करें",
            "सबमिट करें और रेफरेंस नंबर प्राप्त करें",
            "आवेदन स्थिति ट्रैक करें",
        ],
        steps_ta=[
            "வாக்காளர் ஹெல்ப்லைன் போர்ட்டலுக்குச் செல்லவும்",
            "'Form 6 - New Voter Registration' மீது கிளிக் செய்யவும்",
            "உங்கள் மாநிலம் மற்றும் சட்டமன்றத் தொகுதியைத் தேர்ந்தெடுக்கவும்",
            "தனிப்பட்ட விவரங்களை நிரப்பவும் (பெயர், வயது, முகவரி)",
            "பாஸ்போர்ட் புகைப்படம் மற்றும் ஆவணங்களைப் பதிவேற்றவும்",
            "சமர்ப்பித்து குறிப்பு எண்ணைப் பெறவும்",
            "விண்ணப்ப நிலவரத்தைக் கண்காணிக்கவும்",
        ],
        required_documents=["Proof of Age (18+)", "Proof of Residence", "Passport Size Photo", "Citizenship Proof"],
        required_documents_hi=["आयु प्रमाण (18+)", "निवास प्रमाण", "पासपोर्ट साइज फोटो", "नागरिकता प्रमाण"],
        required_documents_ta=["வயதுச் சான்று (18+)", "குடியிருப்புச் சான்று", "பாஸ்போர்ட் அளவு புகைப்படம்", "குடியுரிமைச் சான்று"],
        eligibility="Indian citizen, 18+ years of age, resident of constituency",
        eligibility_hi="भारतीय नागरिक, 18+ वर्ष की आयु, क्षेत्र का निवासी",
        eligibility_ta="இந்திய குடிமகன், 18+ வயது, தொகுதியின் குடியிருப்பாளர்",
        helpline="1950",
        email="support@eci.gov.in",
        youtube_keywords={
            "en": "how to apply voter id card online india",
            "hi": "वोटर आईडी कार्ड ऑनलाइन कैसे बनाएं",
            "ta": "வாக்காளர் அட்டை ஆன்லைனில் எப்படி செய்வது",
            "te": "voter id online apply telugu",
            "bn": "voter id online kivabe korbe",
            "mr": "voter id online kase banvayche",
            "gu": "voter id online kaise banvay",
            "kn": "voter id online apply kannada",
            "ml": "voter id online ethre vidham",
        },
        interactive_steps=VOTER_ID_WALKTHROUGH,
        processing_time="15-30 days",
        processing_time_hi="15-30 दिन",
        processing_time_ta="15-30 நாட்கள்",
        fees="Free",
        fees_hi="निःशुल्क",
        fees_ta="இலவசம்",
    ),
    "passport": GovernmentService(
        id="passport",
        name="Passport",
        name_hi="पासपोर्ट",
        name_ta="பாஸ்போர்ட்",
        category="Travel",
        official_url="https://www.passportindia.gov.in",
        department="Ministry of External Affairs",
        steps=[
            "Register on Passport Seva Portal",
            "Click 'Apply for Fresh Passport'",
            "Fill application form with personal details",
            "Upload documents (Aadhaar, PAN, address proof)",
            "Pay passport fees (₹1500 for normal, ₹2000 for tatkal)",
            "Book appointment at Passport Seva Kendra (PSK)",
            "Visit PSK with original documents for verification",
            "Receive passport in 7-30 days",
        ],
        steps_hi=[
            "पासपोर्ट सेवा पोर्टल पर रजिस्टर करें",
            "'नया पासपोर्ट के लिए आवेदन करें' पर क्लिक करें",
            "व्यक्तिगत विवरण के साथ आवेदन फॉर्म भरें",
            "दस्तावेज़ अपलोड करें (आधार, PAN, पता प्रमाण)",
            "पासपोर्ट फीस जमा करें (सामान्य के लिए ₹1500, तत्काल के लिए ₹2000)",
            "पासपोर्ट सेवा केंद्र (PSK) पर अपॉइंटमेंट बुक करें",
            "सत्यापन के लिए मूल दस्तावेज़ों के साथ PSK जाएं",
            "7-30 दिनों में पासपोर्ट प्राप्त करें",
        ],
        steps_ta=[
            "பாஸ்போர்ட் சேவா போர்ட்டலில் பதிவு செய்யவும்",
            "'புதிய பாஸ்போர்ட்டிற்கு விண்ணப்பிக்க' கிளிக் செய்யவும்",
            "தனிப்பட்ட விவரங்களுடன் விண்ணப்பப் படிவத்தை நிரப்பவும்",
            "ஆவணங்களைப் பதிவேற்றவும் (ஆதார், PAN, முகவரிச் சான்று)",
            "பாஸ்போர்ட் கட்டணத்தைச் செலுத்தவும் (சாதாரணத்திற்கு ₹1500, தட்கலுக்கு ₹2000)",
            "பாஸ்போர்ட் சேவா மையத்தில் (PSK) சந்திப்பைப் பதிவு செய்யவும்",
            "சரிபார்ப்பதற்கு அசல் ஆவணங்களுடன் PSK க்குச் செல்லவும்",
            "7-30 நாட்களில் பாஸ்போர்ட்டைப் பெறவும்",
        ],
        required_documents=["Aadhaar Card", "PAN Card", "Address Proof", "Birth Certificate", "Educational Certificate", "Passport Size Photos"],
        required_documents_hi=["आधार कार्ड", "PAN कार्ड", "पता प्रमाण", "जन्म प्रमाणपत्र", "शैक्षणिक प्रमाणपत्र", "पासपोर्ट साइज फोटो"],
        required_documents_ta=["ஆதார் அட்டை", "PAN அட்டை", "முகவரிச் சான்று", "பிறப்புச் சான்றிதழ்", "கல்விச் சான்றிதழ்", "பாஸ்போர்ட் அளவு புகைப்படங்கள்"],
        eligibility="All Indian citizens with valid proof of identity and address",
        eligibility_hi="पहचान और पते के वैध प्रमाण के साथ सभी भारतीय नागरिक",
        eligibility_ta="செல்லுபடியாகும் அடையாளம் மற்றும் முகவரிச் சான்றுடன் அனைத்து இந்திய குடிமக்கள்",
        helpline="1800-11-8080",
        email="passport@mea.gov.in",
        youtube_keywords={
            "en": "how to apply passport online india passport seva",
            "hi": "पासपोर्ट ऑनलाइन कैसे बनाएं passport seva",
            "ta": "பாஸ்போர்ட் ஆன்லைனில் எப்படி செய்வது passport seva",
            "te": "passport online apply telugu",
            "bn": "passport online kivabe korbe",
            "mr": "passport online kase banvayche",
            "gu": "passport online kaise banvay",
            "kn": "passport online apply kannada",
            "ml": "passport online ethre vidham",
        },
        interactive_steps=PASSPORT_WALKTHROUGH,
        processing_time="7-30 days",
        processing_time_hi="7-30 दिन",
        processing_time_ta="7-30 நாட்கள்",
        fees="₹1500 (Normal), ₹2000 (Tatkal)",
        fees_hi="₹1500 (सामान्य), ₹2000 (तत्काल)",
        fees_ta="₹1500 (சாதாரண), ₹2000 (தட்கல்)",
    ),
    "pm_kisan": GovernmentService(
        id="pm_kisan",
        name="PM Kisan Samman Nidhi",
        name_hi="PM किसान सम्मान निधि",
        name_ta="PM கிசான் சம்மான் நிதி",
        category="Agriculture",
        official_url="https://pmkisan.gov.in",
        department="Ministry of Agriculture",
        steps=[
            "Visit PM Kisan portal",
            "Click on 'Farmer Corner' → 'New Farmer Registration'",
            "Enter Aadhaar number for authentication",
            "Fill bank account details (account number, IFSC)",
            "Enter land ownership details",
            "Submit for verification by local authorities",
            "Receive ₹6000 per year in 3 installments",
        ],
        steps_hi=[
            "PM किसान पोर्टल पर जाएं",
            "'किसान कॉर्नर' → 'नया किसान पंजीकरण' पर क्लिक करें",
            "प्रमाणीकरण के लिए आधार नंबर दर्ज करें",
            "बैंक खाता विवरण भरें (खाता संख्या, IFSC)",
            "भूमि स्वामित्व विवरण दर्ज करें",
            "स्थानीय अधिकारियों द्वारा सत्यापन के लिए सबमिट करें",
            "3 किश्तों में वर्ष में ₹6000 प्राप्त करें",
        ],
        steps_ta=[
            "PM கிசான் போர்ட்டலுக்குச் செல்லவும்",
            "'விவசாயி கார்னர்' → 'புதிய விவசாயி பதிவு' மீது கிளிக் செய்யவும்",
            "அங்கீகாரத்திற்கு ஆதார் எண்ணை உள்ளிடவும்",
            "வங்கி கணக்கு விவரங்களை நிரப்பவும் (கணக்கு எண், IFSC)",
            "நில உரிமை விவரங்களை உள்ளிடவும்",
            "உள்ளூர் அதிகாரிகளால் சரிபார்ப்பதற்கு சமர்ப்பிக்கவும்",
            "3 தவணைகளாக ஆண்டுக்கு ₹6000 பெறவும்",
        ],
        required_documents=["Aadhaar Card", "Bank Account Passbook", "Land Ownership Documents", "Mobile Number"],
        required_documents_hi=["आधार कार्ड", "बैंक खाता पासबुक", "भूमि स्वामित्व दस्तावेज़", "मोबाइल नंबर"],
        required_documents_ta=["ஆதார் அட்டை", "வங்கி கணக்கு பாஸ்புக்", "நில உரிமை ஆவணங்கள்", "மொபைல் எண்"],
        eligibility="Small and marginal farmers with cultivable land up to 2 hectares",
        eligibility_hi="2 हेक्टेयर तक की खेती योग्य भूमि वाले छोटे और सीमांत किसान",
        eligibility_ta="2 ஹெக்டேர் வரை சாகுபடி நிலம் கொண்ட சிறு மற்றும் குறு விவசாயிகள்",
        helpline="155261",
        email="pmkisan-ic@nic.in",
        youtube_keywords={
            "en": "how to apply pm kisan samman nidhi online registration",
            "hi": "PM किसान सम्मान निधि ऑनलाइन रजिस्ट्रेशन कैसे करें",
            "ta": "PM கிசான் சம்மான் நிதி ஆன்லைன் பதிவு எப்படி செய்வது",
            "te": "pm kisan online apply telugu",
            "bn": "pm kisan online kivabe korbe",
            "mr": "pm kisan online kase banvayche",
            "gu": "pm kisan online kaise banvay",
            "kn": "pm kisan online apply kannada",
            "ml": "pm kisan online ethre vidham",
        },
        interactive_steps=PM_KISAN_WALKTHROUGH,
        processing_time="30-60 days",
        processing_time_hi="30-60 दिन",
        processing_time_ta="30-60 நாட்கள்",
        fees="Free",
        fees_hi="निःशुल्क",
        fees_ta="இலவசம்",
    ),
}


def get_service(service_id: str) -> GovernmentService | None:
    """Get a service by ID."""
    return GOVERNMENT_SERVICES.get(service_id)


def search_services(query: str, language: str = "en") -> list[GovernmentService]:
    """Search services by name or category."""
    query_lower = query.lower()
    results = []

    for service in GOVERNMENT_SERVICES.values():
        # Search in English
        if query_lower in service.name.lower() or query_lower in service.category.lower():
            results.append(service)
            continue

        # Search in Hindi
        if language == "hi" and query_lower in service.name_hi.lower():
            results.append(service)
            continue

        # Search in Tamil
        if language == "ta" and query_lower in service.name_ta.lower():
            results.append(service)
            continue

    return results


def get_all_services() -> list[GovernmentService]:
    """Get all services."""
    return list(GOVERNMENT_SERVICES.values())


def get_services_by_category(category: str) -> list[GovernmentService]:
    """Get services by category."""
    return [s for s in GOVERNMENT_SERVICES.values() if s.category.lower() == category.lower()]
