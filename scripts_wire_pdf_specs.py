from pathlib import Path
path = Path('/home/ubuntu/sbts-professional/client/src/pages/ProjectDetail.tsx')
text = path.read_text()
text = text.replace('import { bulkPasteColumns, bulkPasteExampleRow, parseBulkPaste } from "@shared/blindBulkPaste";\n', 'import { bulkPasteColumns, bulkPasteExampleRow, parseBulkPaste } from "@shared/blindBulkPaste";\nimport { buildCertificatePdfTableSpec, buildTagsPdfSpec } from "@shared/pdfExports";\n')
old_cert = '''function downloadCertificatePdf(project: ExportProject, blinds: ExportBlind[], metrics: ExportMetrics) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString();
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SBTS Unified Certificate Package", 12, 10);
  doc.setFontSize(10);
  doc.text(`${project.id} · ${project.name} · Generated ${generatedAt}`, 12, 17);

  autoTable(doc, {
    startY: 30,
    head: [["Metric", "Planned", "Registered", "High", "Critical", "Inspection Ready", "Progress"]],
    body: [["Project summary", metrics.plannedBlinds, metrics.registeredBlinds, metrics.highPriorityBlinds, metrics.criticalBlinds, metrics.inspectionReadyBlinds, `${project.progress}%`]],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [14, 116, 144] },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["#", "Blind Tag", "Type / Size", "Phase", "Priority", "Owner", "Isolation", "Slip Gate", "Notes"]],
    body: blinds.map((blind, index) => [
      index + 1,
      `${blind.tag}
${blind.equipment || "No equipment"}`,
      `${blind.type}
${blind.size}${blind.rate ? ` · Rate ${blind.rate}` : ""}`,
      blind.phase,
      blind.priority,
      blind.owner,
      blind.isolationPoint || "Not specified",
      blind.type === "Slip Blind" ? `${blind.slipMetalForemanApproved ? "Foreman OK" : "Foreman pending"} / ${blind.slipBlindMerged ? "Merged" : "Not merged"}` : "N/A",
      blind.notes || "",
    ]),
    theme: "striped",
    styles: { fontSize: 7.2, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 32 }, 2: { cellWidth: 32 }, 8: { cellWidth: 50 } },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Area: ${project.areaCode} · ${project.areaName}`, 12, 202);
    },
  });
  doc.save(`${safeFileName(project.id)}-certificates.pdf`);
}
'''
new_cert = '''function downloadCertificatePdf(project: ExportProject, blinds: ExportBlind[], metrics: ExportMetrics) {
  const spec = buildCertificatePdfTableSpec(project, blinds, metrics);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 297, 24, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(spec.title, 12, 10);
  doc.setFontSize(10);
  doc.text(spec.subtitle, 12, 17);

  autoTable(doc, {
    startY: 30,
    head: spec.summaryHead,
    body: spec.summaryBody,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [14, 116, 144] },
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: spec.blindHead,
    body: spec.blindRows,
    theme: "striped",
    styles: { fontSize: 7.2, cellPadding: 1.8, overflow: "linebreak" },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 32 }, 2: { cellWidth: 32 }, 8: { cellWidth: 50 } },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(spec.footerText, 12, 202);
    },
  });
  doc.save(spec.filename);
}
'''
old_tags = '''function downloadTagsPdf(project: ExportProject, blinds: ExportBlind[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const generatedAt = new Date().toLocaleString();
  blinds.forEach((blind, index) => {
    if (index > 0) doc.addPage();
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.2);
    doc.roundedRect(12, 12, 186, 260, 4, 4);
    doc.setFillColor(14, 116, 144);
    doc.rect(12, 12, 186, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SBTS BLIND TAG", 18, 23);
    doc.text(blind.priority, 174, 23, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(30);
    doc.text(blind.tag, 18, 50);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    const rows = [
      ["Project", project.id],
      ["Equipment", blind.equipment || "N/A"],
      ["Type / Size", `${blind.type} · ${blind.size}${blind.rate ? ` · Rate ${blind.rate}` : ""}`],
      ["Phase", blind.phase],
      ["Phase Owner", blind.owner],
      ["Isolation", blind.isolationPoint || "N/A"],
      ["Location", blind.location || "N/A"],
    ];
    autoTable(doc, {
      startY: 70,
      body: rows,
      theme: "plain",
      styles: { fontSize: 12, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 45 }, 1: { fontStyle: "bold", textColor: [15, 23, 42] } },
    });
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(50, 154, 110, 62, 4, 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(51, 65, 85);
    doc.text(blind.tag, 105, 187, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`${project.areaCode} · Generated ${generatedAt}`, 18, 262);
  });
  if (blinds.length === 0) {
    doc.setFontSize(14);
    doc.text("No blind tags available.", 20, 30);
  }
  doc.save(`${safeFileName(project.id)}-blind-tags.pdf`);
}
'''
new_tags = '''function downloadTagsPdf(project: ExportProject, blinds: ExportBlind[]) {
  const spec = buildTagsPdfSpec(project, blinds);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  spec.pages.forEach((page, index) => {
    if (index > 0) doc.addPage();
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.2);
    doc.roundedRect(12, 12, 186, 260, 4, 4);
    doc.setFillColor(14, 116, 144);
    doc.rect(12, 12, 186, 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("SBTS BLIND TAG", 18, 23);
    doc.text(page.priority, 174, 23, { align: "right" });
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(30);
    doc.text(page.tag, 18, 50);
    doc.setFontSize(13);
    doc.setFont("helvetica", "normal");
    autoTable(doc, {
      startY: 70,
      body: page.rows,
      theme: "plain",
      styles: { fontSize: 12, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", textColor: [71, 85, 105], cellWidth: 45 }, 1: { fontStyle: "bold", textColor: [15, 23, 42] } },
    });
    doc.setDrawColor(148, 163, 184);
    doc.roundedRect(50, 154, 110, 62, 4, 4);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(51, 65, 85);
    doc.text(page.qrLabel, 105, 187, { align: "center" });
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(page.footerText, 18, 262);
  });
  if (spec.pages.length === 0) {
    doc.setFontSize(14);
    doc.text(spec.emptyMessage, 20, 30);
  }
  doc.save(spec.filename);
}
'''
for old, new, name in [(old_cert, new_cert, 'certificate pdf'), (old_tags, new_tags, 'tags pdf')]:
    if old not in text:
        raise SystemExit(f'Could not find {name} block')
    text = text.replace(old, new)
path.write_text(text)
