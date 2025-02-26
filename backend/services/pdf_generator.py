from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import json
import os

def generate_itinerary_pdf(trip_data, output_dir="pdfs"):
    # Ensure the output directory exists
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    # Generate a unique filename
    filename = f"{output_dir}/itinerary_{trip_data['id']}.pdf"
    
    # Create the PDF document
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=72
    )

    # Get styles
    styles = getSampleStyleSheet()
    title_style = styles['Heading1']
    heading_style = styles['Heading2']
    normal_style = styles['Normal']

    # Build the PDF content
    story = []

    # Add title
    story.append(Paragraph("Your Travel Itinerary", title_style))
    story.append(Spacer(1, 12))

    # Add destinations
    destinations = ", ".join(trip_data['destinations'])
    story.append(Paragraph(f"Destinations: {destinations}", heading_style))
    story.append(Spacer(1, 12))

    # Add duration
    story.append(Paragraph(f"Duration: {trip_data['duration']} days", heading_style))
    story.append(Spacer(1, 12))

    # Add daily itinerary
    itinerary = trip_data['itinerary']
    for day, activities in itinerary.items():
        story.append(Paragraph(f"Day {day}", heading_style))
        for activity in activities:
            story.append(Paragraph(f"• {activity}", normal_style))
        story.append(Spacer(1, 12))

    # Build the PDF
    doc.build(story)
    
    return filename