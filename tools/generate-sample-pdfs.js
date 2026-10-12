// Builds sample OPD and Lab bill PDFs with the same builder the page uses.
// Usage: cd tools && npm install && npm run samples   -> writes ../samples/*.pdf
const {jsPDF}=require("jspdf");require("jspdf-autotable").applyPlugin(jsPDF);
const {buildBillPdf}=require("../app/js/pdf-bill-builder.js");const fs=require("fs"),path=require("path");
const H={name:"Bengal Care Hospital",address:"Kolkata, West Bengal",tagline:"",phone:"",email:"",website:"",regNo:"",gstin:"",timings:""};
const pt={name:"Ananya Sen",age:"29",sex:"Female",phone:"9830012345",address:"12/3 Lake Road, Kolkata - 700029, West Bengal"};
const now=new Date().toISOString();
const opd={billNo:"OPD-SAMPLE-0001",createdAt:now,uhid:"WB-2026-00001",patient:pt,doctorName:"Dr. S. Chatterjee",department:"General Medicine",consultType:"general",apptDate:"2026-10-12",apptTime:"10:30",
 items:[{type:"reg",name:"Registration Fee",desc:"OPD Registration",qty:1,rate:100,amount:100},{type:"consult",name:"Consultation Fee",desc:"Dr. S. Chatterjee (General Medicine)",qty:1,rate:600,amount:600},
  {type:"lab",code:"CBC",name:"Complete Blood Count (CBC)",sampleType:"Whole Blood (EDTA)",qty:1,rate:350,amount:350},{type:"lab",code:"LIPID",name:"Lipid Profile (TC, TG, HDL, LDL, VLDL)",sampleType:"Serum",qty:1,rate:800,amount:800}],
 total:1850,discount:50,net:1800,payment:{method:"UPI (Google Pay / PhonePe / etc.)",paid:1800,ref:"UPI0000000"},balance:0,status:"paid",medicalIssue:"Fever"};
const lab={billNo:"LAB-SAMPLE-0001",createdAt:now,uhid:"WB-2026-00001",patient:pt,referringDoctor:"Dr. S. Chatterjee (General Medicine)",sampleDate:"2026-10-12",sampleTime:"09:00",sampleType:"Blood (Venous)",sampleStatus:"Pending",remarks:"",
 items:[{code:"CBC",name:"Complete Blood Count (CBC)",sampleType:"Whole Blood (EDTA)",rate:350,qty:1,amount:350},{code:"LIPID",name:"Lipid Profile (TC, TG, HDL, LDL, VLDL)",sampleType:"Serum",rate:800,qty:1,amount:800},{code:"TSH",name:"Thyroid Stimulating Hormone (TSH)",sampleType:"Serum",rate:450,qty:1,amount:450}],
 total:1600,homeCollection:0,discount:100,net:1500,payment:{method:"Cash",paid:1500,ref:""},balance:0,status:"paid"};
const out=path.join(__dirname,"..","samples");
fs.writeFileSync(path.join(out,"OPD-bill-sample.pdf"),Buffer.from(buildBillPdf(jsPDF,"opd",opd,{hospital:H,preps:["Lipid Profile: 10-12 hours fasting"]}).output("arraybuffer")));
fs.writeFileSync(path.join(out,"LAB-bill-sample.pdf"),Buffer.from(buildBillPdf(jsPDF,"lab",lab,{hospital:H,preps:["Lipid Profile: 10-12 hours fasting"]}).output("arraybuffer")));
console.log("Wrote samples/OPD-bill-sample.pdf and samples/LAB-bill-sample.pdf");
