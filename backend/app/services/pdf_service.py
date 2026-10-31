import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from backend.app.config import settings

def generate_invoice_pdf(invoice, customer, lines, discounts=None) -> str:
    """
    Generates a professional PDF invoice using ReportLab and returns the relative file path.
    """
    filename = f"{invoice.invoice_number}.pdf"
    filepath = os.path.join(settings.INVOICE_PDF_DIR, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'InvoiceTitle',
        parent=styles['Heading1'],
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#1E293B')
    )
    subtitle_style = ParagraphStyle(
        'InvoiceSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#64748B')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#0F172A'),
        fontName='Helvetica-Bold'
    )
    regular_style = ParagraphStyle(
        'RegularText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#334155')
    )

    elements = []

    # Header: Brightloop Software & Invoice Number
    header_data = [
        [
            Paragraph("<b>BRIGHTLOOP SOFTWARE</b><br/>"
                      "100 Tech Park, Indiranagar<br/>"
                      "Bangalore, KA 560038, India<br/>"
                      "GSTIN: 29ABCDE1234F1Z5<br/>"
                      "support@brightloop.com", subtitle_style),
            Paragraph(f"<b>TAX INVOICE</b><br/>"
                      f"<b>Invoice #:</b> {invoice.invoice_number}<br/>"
                      f"<b>Date:</b> {invoice.invoice_date.strftime('%d-%b-%Y')}<br/>"
                      f"<b>Due Date:</b> {invoice.due_date.strftime('%d-%b-%Y')}<br/>"
                      f"<b>Status:</b> {invoice.status}", regular_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[300, 240])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))

    # Bill To Information
    bill_to_data = [
        [
            Paragraph("<b>BILL TO:</b>", bold_style),
            Paragraph("<b>BILLING CYCLE:</b>", bold_style)
        ],
        [
            Paragraph(f"<b>{customer.company_name}</b><br/>"
                      f"GSTIN: {customer.tax_identifier or 'Unregistered'}<br/>"
                      f"{customer.billing_address}<br/>"
                      f"{customer.city}, {customer.postal_code}, {customer.country}<br/>"
                      f"Phone: {customer.phone_number}", regular_style),
            Paragraph(f"<b>Period:</b> {invoice.billing_cycle_start.strftime('%d-%b-%Y')} to {invoice.billing_cycle_end.strftime('%d-%b-%Y')}<br/>"
                      f"<b>Subscription:</b> {invoice.subscription.subscription_number if invoice.subscription else 'Direct'}", regular_style)
        ]
    ]
    bill_table = Table(bill_to_data, colWidths=[300, 240])
    bill_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(bill_table)
    elements.append(Spacer(1, 15))

    # Line Items Table
    table_data = [
        ["#", "Item Description", "Qty", "Unit Price (₹)", "Tax (%)", "Line Total (₹)"]
    ]
    idx = 1
    for line in lines:
        desc = line.product_name_snapshot
        if line.variant_name_snapshot:
            desc += f" ({line.variant_name_snapshot})"
        table_data.append([
            str(idx),
            desc,
            str(line.quantity),
            f"{line.unit_price:,.2f}",
            f"{line.tax_rate:.1f}%",
            f"{line.line_total:,.2f}"
        ])
        idx += 1

    items_table = Table(table_data, colWidths=[30, 240, 40, 80, 60, 90])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 0), (-1, 0), 6),
        ('ALIGN', (2, 0), (-1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 5),
        ('TOPPADDING', (0, 1), (-1, -1), 5),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # Summary Totals Table
    summary_data = [
        ["Pre-Tax Subtotal:", f"₹ {invoice.subtotal:,.2f}"],
        ["Discount Deductions:", f"- ₹ {invoice.discount_total:,.2f}"],
        ["Goods & Services Tax (GST):", f"₹ {invoice.tax_total:,.2f}"],
        ["Total Amount Due:", f"₹ {invoice.total_amount:,.2f}"],
        ["Total Paid:", f"₹ {invoice.amount_paid:,.2f}"],
        ["Outstanding Balance:", f"₹ {(invoice.total_amount - invoice.amount_paid):,.2f}"]
    ]
    summary_table = Table(summary_data, colWidths=[380, 160])
    summary_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor('#1E293B')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#EEF2FF')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 25))

    # Payment Instructions Footer
    footer_text = Paragraph(
        "<b>Payment Instructions:</b> Please remit payment via Bank Transfer / NEFT to:<br/>"
        "Account Name: <b>Brightloop Software Pvt Ltd</b> | Bank: <b>HDFC Bank</b><br/>"
        "Account Number: <b>50200012345678</b> | IFSC Code: <b>HDFC0000240</b><br/>"
        "<i>Thank you for subscribing to Brightloop Software!</i>",
        subtitle_style
    )
    elements.append(footer_text)

    doc.build(elements)
    return f"/invoices_pdf/{filename}"
