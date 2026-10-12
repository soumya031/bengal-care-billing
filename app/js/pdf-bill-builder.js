/* A4 bill PDF builder (jsPDF 2.5.1 + jspdf-autotable 3.8.2). */
/* PDF_BUILDER_START */
function amountWords(n) {
  n = Math.round((+n || 0) * 100) / 100;
  const r = Math.floor(n),
    p = Math.round((n - r) * 100);
  const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ],
    t = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (x) => (x < 20 ? a[x] : t[Math.floor(x / 10)] + (x % 10 ? " " + a[x % 10] : ""));
  const three = (x) =>
    (x >= 100 ? a[Math.floor(x / 100)] + " Hundred" + (x % 100 ? " " : "") : "") +
    (x % 100 ? two(x % 100) : "");
  const w = (x) => {
    if (!x) return "Zero";
    let s = "";
    const cr = Math.floor(x / 1e7);
    x %= 1e7;
    const l = Math.floor(x / 1e5);
    x %= 1e5;
    const th = Math.floor(x / 1e3);
    x %= 1e3;
    if (cr) s += w(cr) + " Crore ";
    if (l) s += two(l) + " Lakh ";
    if (th) s += two(th) + " Thousand ";
    if (x) s += three(x);
    return s.trim();
  };
  return "Rupees " + w(r) + (p ? " and " + two(p) + " Paise" : "") + " Only";
}
/* Layout follows the supplied template (Medical_Bill_Suresh.pdf): invoice meta top-right, hospital block left,
   Patient Information grid, Services table, totals right, payment method, centred footer note. */
function buildBillPdf(JsPDF, kind, b, opts) {
  opts = opts || {};
  const H = opts.hospital || { name: "Hospital" };
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const W = 210,
    M = 15,
    CW = W - 2 * M;
  const ink = [31, 41, 55],
    body = [55, 65, 81],
    muted = [107, 114, 128],
    soft = [120, 134, 160],
    line = [226, 232, 240],
    thbg = [247, 249, 252];
  const rs = (v) => "Rs. " + (+v || 0).toFixed(2);
  const fd = (s) => {
    if (!s) return "-";
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  const ft = (t) => {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return (
      String(h % 12 || 12).padStart(2, "0") + ":" + String(m).padStart(2, "0") + (h < 12 ? " AM" : " PM")
    );
  };
  const created = new Date(b.createdAt);
  const billDate = created.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const p = b.patient || {},
    pay = b.payment || {};
  // invoice meta, top right (bold label + regular value)
  const meta = [
    ["Invoice No:", b.billNo],
    ["Bill Date:", billDate],
    kind === "opd"
      ? ["Appointment:", fd(b.apptDate) + ", " + ft(b.apptTime)]
      : ["Collection:", fd(b.sampleDate) + (b.sampleTime ? ", " + ft(b.sampleTime) : "")],
    H.phone ? ["Contact:", H.phone] : null,
  ].filter(Boolean);
  doc.setFontSize(9.5);
  let my = 13;
  for (const [l, v] of meta) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...body);
    const vw = doc.getTextWidth(v);
    doc.text(v, W - M, my, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...ink);
    doc.text(l, W - M - vw - 1.5, my, { align: "right" });
    my += 5.2;
  }
  // hospital block, left
  let y = Math.max(my + 6, 36);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...ink);
  doc.text(H.name || "Hospital", M, y);
  y += 6.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...body);
  for (const l of doc.splitTextToSize(H.address || "", CW * 0.7)) {
    doc.text(l, M, y);
    y += 4.6;
  }
  const contact = [H.email && "Email: " + H.email, H.website, H.timings && "OPD: " + H.timings]
    .filter(Boolean)
    .join("   |   ");
  const reg = [H.regNo && "Reg. No: " + H.regNo, H.gstin && "GSTIN: " + H.gstin]
    .filter(Boolean)
    .join("   |   ");
  doc.setFontSize(8.5);
  doc.setTextColor(...soft);
  for (const l of [H.tagline, contact, reg].filter(Boolean)) {
    for (const s of doc.splitTextToSize(l, CW * 0.8)) {
      doc.text(s, M, y);
      y += 4.2;
    }
  }
  y += 5;
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 11;
  // bill title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ink);
  doc.text("Patient Information", M, y);
  doc.setFontSize(9);
  doc.setTextColor(...muted);
  doc.text(kind === "opd" ? "OPD BILL" : "LABORATORY BILL", W - M, y, { align: "right" });
  y += 8;
  // patient info grid, 3 columns
  const age = p.age ? " (Age: " + p.age + ")" : "";
  const fields =
    kind === "opd"
      ? [
          ["Patient Name", (p.name || "-") + age],
          ["Mobile Number", p.phone || "-"],
          ["Doctor", b.doctorName + (b.department ? " - " + b.department : "")],
          ["UHID", b.uhid || "-"],
          ["Gender", p.sex || "-"],
          ["Consultation", b.consultType === "followup" ? "OPD - Follow-up" : "OPD - General"],
          ["Address", p.address || "-"],
          b.medicalIssue ? ["Medical Issue", b.medicalIssue] : null,
          b.reason ? ["Reason for Visit", b.reason] : null,
        ].filter(Boolean)
      : [
          ["Patient Name", (p.name || "-") + age],
          ["Mobile Number", p.phone || "-"],
          ["Referring Doctor", b.referringDoctor || "Self"],
          ["UHID", b.uhid || "-"],
          ["Gender", p.sex || "-"],
          ["Sample Type", b.sampleType || "-"],
          ["Address", p.address || "-"],
          ["Sample Status", b.sampleStatus || "Pending"],
          b.medicalIssue ? ["Medical Issue", b.medicalIssue] : b.remarks ? ["Remarks", b.remarks] : null,
        ].filter(Boolean);
  const colW = CW / 3;
  for (let i = 0; i < fields.length; i += 3) {
    let rowH = 0;
    for (let c = 0; c < 3 && i + c < fields.length; c++) {
      const [l, v] = fields[i + c];
      const x = M + c * colW;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.8);
      doc.setTextColor(...ink);
      doc.text(l, x, y);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...body);
      const ls = doc.splitTextToSize(String(v), colW - 6);
      doc.text(ls, x, y + 4.8);
      rowH = Math.max(rowH, 4.8 + ls.length * 4.3);
    }
    y += rowH + 4;
  }
  y += 6;
  // services table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...ink);
  doc.text(kind === "opd" ? "Services" : "Laboratory Tests", M, y);
  y += 4;
  const head =
    kind === "opd" ? [["SERVICE", "QUANTITY", "RATE", "COST"]] : [["TEST", "QUANTITY", "RATE", "COST"]];
  const isLab = (i) => i.type === "lab";
  const secRow = (t) => [
    {
      content: t,
      colSpan: 4,
      styles: {
        fontStyle: "bold",
        fontSize: 8,
        textColor: muted,
        fillColor: [251, 252, 254],
        cellPadding: { top: 2.4, bottom: 2.4, left: 4, right: 4 },
      },
    },
  ];
  const opdRow = (i) => [
    i.name + (i.desc ? "\n" + i.desc : ""),
    String(i.qty || 1),
    rs(i.rate != null ? i.rate : i.amount),
    rs(i.amount),
  ];
  let rows;
  if (kind === "opd") {
    const sv = b.items.filter((i) => !isLab(i)),
      lb = b.items.filter(isLab);
    rows = lb.length
      ? [
          ...(sv.length ? [secRow("CONSULTATION & SERVICES"), ...sv.map(opdRow)] : []),
          secRow("LABORATORY TESTS"),
          ...lb.map((i) => [
            i.name + "\n" + i.code + (i.sampleType && i.sampleType !== "—" ? "  |  " + i.sampleType : ""),
            "1",
            rs(i.amount),
            rs(i.amount),
          ]),
        ]
      : sv.map(opdRow);
  } else
    rows = b.items.map((i) => [
      i.name + "\n" + i.code + (i.sampleType && i.sampleType !== "—" ? "  |  " + i.sampleType : ""),
      String(i.qty),
      rs(i.rate),
      rs(i.amount),
    ]);
  doc.autoTable({
    startY: y,
    head,
    body: rows,
    theme: "plain",
    margin: { left: M, right: M },
    headStyles: {
      fillColor: thbg,
      textColor: ink,
      fontStyle: "bold",
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    styles: {
      fontSize: 9.5,
      textColor: body,
      cellPadding: { top: 3.6, bottom: 3.6, left: 4, right: 4 },
      lineColor: line,
    },
    columnStyles: {
      1: { halign: "center", cellWidth: 28 },
      2: { halign: "right", cellWidth: 32 },
      3: { halign: "right", cellWidth: 34 },
    },
    tableLineColor: line,
    tableLineWidth: 0.3,
    didParseCell: (d) => {
      const last = d.table.columns.length - 1;
      if (d.section === "head") {
        if (d.column.index >= 2) d.cell.styles.halign = "right";
        if (d.column.index === 1) d.cell.styles.halign = "center";
      }
    },
    didDrawCell: (d) => {
      if (d.section === "body" && d.row.index < d.table.body.length - 1) {
        doc.setDrawColor(...line);
        doc.setLineWidth(0.25);
        doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
      }
      if (d.section === "head") {
        doc.setDrawColor(...line);
        doc.setLineWidth(0.3);
        doc.line(d.cell.x, d.cell.y + d.cell.height, d.cell.x + d.cell.width, d.cell.y + d.cell.height);
      }
    },
    willDrawCell: (d) => {
      if (d.section === "body" && d.column.index === 0 && typeof d.cell.raw === "string") {
        const [t1, ...rest] = String(d.cell.raw).split("\n");
        if (rest.length) {
          d.cell.text = [];
          const x = d.cell.x + 4,
            yy = d.cell.y + d.cell.padding("top") + 3.2;
          doc.setTextColor(...body);
          doc.setFontSize(9.5);
          doc.text(t1, x, yy);
          doc.setFontSize(8);
          doc.setTextColor(...muted);
          doc.text(rest.join(" "), x, yy + 4.3);
          doc.setFontSize(9.5);
        }
      }
    },
  });
  y = doc.lastAutoTable.finalY + 12;
  if (y > 215) {
    doc.addPage();
    y = 22;
  }
  // totals (right)
  const tx1 = W - M - 80,
    tx2 = W - M;
  const trow = (l, v, opt = {}) => {
    doc.setFont("helvetica", opt.bold ? "bold" : "normal");
    doc.setFontSize(opt.size || 9.5);
    doc.setTextColor(...(opt.color || (opt.bold ? ink : body)));
    doc.setFont("helvetica", "bold");
    doc.text(l, tx1, y);
    doc.setFont("helvetica", opt.bold ? "bold" : "normal");
    doc.text(v, tx2, y, { align: "right" });
    y += opt.gap || 7;
  };
  const labSum = kind === "opd" ? b.items.filter(isLab).reduce((a, i) => a + (+i.amount || 0), 0) : 0;
  if (labSum) {
    trow("Consultation & Services:", rs(b.total - labSum));
    trow("Laboratory Tests:", rs(labSum));
  }
  trow("Subtotal:", rs(b.total), { color: body });
  if (b.homeCollection) trow("Home Collection:", rs(b.homeCollection));
  if (+b.discount) trow("Discount:", "- " + rs(b.discount));
  y += 1;
  doc.setDrawColor(...line);
  doc.setLineWidth(0.4);
  doc.line(tx1, y - 4.5, tx2, y - 4.5);
  y += 2;
  trow("Total Amount:", rs(b.net), { bold: true, size: 12.5, gap: 8 });
  trow("Amount Paid:", rs(pay.paid));
  const due = (+b.balance || 0) > 0.004;
  trow("Balance Due:", rs(b.balance), { bold: due, color: due ? [200, 40, 40] : body });
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  doc.setTextColor(...muted);
  const words = doc.splitTextToSize("(" + amountWords(b.net) + ")", 80);
  doc.text(words, tx2, y, { align: "right" });
  y += words.length * 4 + 6;
  // payment + status
  y += 2;
  doc.setDrawColor(...line);
  doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 9;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...ink);
  doc.text("Payment Method:", M, y);
  const pmx = M + doc.getTextWidth("Payment Method:") + 2;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...body);
  doc.text((pay.method || "-") + (pay.ref ? "   (Ref: " + pay.ref + ")" : ""), pmx, y);
  const st =
    b.status === "cancelled"
      ? ["CANCELLED", [200, 40, 40]]
      : b.status === "paid"
        ? ["PAID", [13, 122, 79]]
        : b.status === "partial"
          ? ["PARTLY PAID", [180, 110, 10]]
          : ["UNPAID", [180, 110, 10]];
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  const sw = doc.getTextWidth(st[0]) + 8;
  doc.setDrawColor(...st[1]);
  doc.setTextColor(...st[1]);
  doc.setLineWidth(0.5);
  doc.roundedRect(W - M - sw, y - 4.6, sw, 6.8, 1.2, 1.2, "S");
  doc.text(st[0], W - M - sw / 2, y, { align: "center" });
  y += 8;
  if (opts.preps && opts.preps.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...ink);
    doc.text("Patient Preparation:", M, y);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...body);
    const ls = doc.splitTextToSize(opts.preps.join("   |   "), CW - 36);
    doc.text(ls, M + 34, y);
    y += ls.length * 4.3 + 3;
  }
  if (y > 272) {
    doc.addPage();
    y = 22;
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...muted);
  const note =
    "This is a computer-generated document and does not require a signature. All payments are subject to the hospital's terms and conditions. Healthcare services by a clinical establishment are exempt from GST.";
  const nl = doc.splitTextToSize(note, CW);
  doc.text(nl, W / 2, y + 2, { align: "center" });
  y += 2 + nl.length * 3.6 + 2;
  doc.setFontSize(7.2);
  doc.setTextColor(...soft);
  doc.text(
    "Printed " +
      new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }) +
      "   |   " +
      b.billNo,
    W / 2,
    Math.max(y, 0),
    { align: "center" },
  );
  if (b.status === "cancelled") {
    doc.setTextColor(240, 170, 170);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(64);
    doc.text("CANCELLED", W / 2, 180, { align: "center", angle: 30 });
  }
  return doc;
}
/* PDF_BUILDER_END */
if (typeof module !== "undefined") module.exports = { buildBillPdf, amountWords };
