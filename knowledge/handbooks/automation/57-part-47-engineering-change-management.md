---
handbook: automation
handbook_title: "Automation Equipment Building Handbook"
part_index: 57
part_title: "Part 47 — Engineering change management"
source_document: "Automation_Equipment_Building_Handbook.docx"
data_type: TEAL_INTERNAL
verification_status: SOURCE_DOCUMENTED
transcription: automated docx→markdown; figures not transcribed; equations linearised
---
## Part 47 — Engineering change management

After Gate 3 every change is a decision with a cost, a schedule effect and a document trail. Route every change through a request (ECR), an impact assessment, a decision by a change board, a notice (ECN) that updates every affected document and part, and a verification. Changes that alter customer-agreed requirements need the customer's written approval and, usually, a change order.

### 47.1 Objective

Control changes to design, BOM, software and documents so the built machine always matches released documentation and every change is justified, approved, implemented and verified.

### 47.2 Engineering concept

| Term | Meaning |
|---|---|
| ECR (engineering change request) | Proposal: what, why, affected items, urgency |
| Impact assessment | Effects on function, safety, cost, schedule, stock, work in progress, suppliers, customer documents, certification |
| CCB (change control board) | Decides: approve, reject, defer; sets effectivity |
| ECN (engineering change notice) | Released instruction: new revisions, disposition of old parts, implementation steps |
| Effectivity | Which machines, serial numbers or dates the change applies to |
| Interchangeability | If the new part cannot replace the old in all uses, it gets a new part number, not a new revision |

| Change class | Criteria | Approval |
|---|---|---|
| Class I (major) | Affects form, fit, function, safety, performance, customer-approved documents or certification | CCB plus customer where contract requires |
| Class II (minor) | Documentation corrections, cosmetic changes, equivalent substitutions | Discipline lead and configuration manager |

### 47.3 Architecture — change workflow

- Raise ECR with description, reason, evidence and proposed solution.
- Classify (Class I or II).
- Assess impact across disciplines; estimate cost and schedule effect.
- Decide at CCB; for Class I affecting URS items, obtain customer approval and a change order.
- Release ECN: updated drawings, BOM, software versions, schematics, manuals; disposition of stock and WIP (use, rework, scrap).
- Implement in shop or field; update as-built records.
- Verify: test the changed function; re-run affected safety validations and FAT tests.
- Close and update FMEA, risk assessment and lessons learned.

### 47.4 Components — revision rules

| Object | Revision scheme | Rule |
|---|---|---|
| Drawings | Letters (A, B, C) after release; numbers or "0x" before release | Revision block describes each change and ECN number |
| BOM | Revision per assembly | BOM revision changes whenever a child part or quantity changes |
| Software | Semantic versions (major.minor.patch) with checksums | Version displayed on HMI; every release linked to an ECN or release note |
| Parameters and recipes | Versioned files | Changes logged with user and time |
| Customer documents | Revision and date on every page | Re-issued after changes affecting them |

### 47.5 Design methodology

- Define the configuration baseline at each gate (G2 architecture, G3 design, FAT as-tested, SAT as-installed).
- Use one change system for mechanics, electrics, software and documents.
- Hold weekly CCB meetings during design and build; daily during FAT and SAT if needed.
- Price customer-driven changes and agree before implementing.
- Keep field retrofit records per machine serial number.

### 47.6 Calculations

C_(change)=C_(eng)+C_(parts)+C_(scrap)+C_(rework)+C_(retest)+C_(delay)

C_(stage)≈C_0⋅k^s

Cost of a change grows by stage s with a factor k often quoted around 10 per stage (design → build → field) as a planning heuristic. Example: changing the nest pin material at design costs 2 engineering hours (₹5,000); after FAT it costs new pins, rework of two nests, re-calibration and a repeat of FAT-08 (about ₹60,000 and three days); after SAT it adds travel and customer downtime.

### 47.7 Industrial example — ECN after FAT

| Field | Entry |
|---|---|
| ECR | Nest locating pins show wear marks after the 2 h FAT run |
| Class | I (affects position accuracy, a URS item) |
| Root cause | Pins through-hardened to a lower hardness than specified; supplier heat-treatment deviation |
| Solution | Hardened pins to specification plus replaceable pin bushings |
| Impact | ₹0.6 lakh, 3 days; FAT-08 repeat; no URS change so no customer change order; customer informed |
| Affected documents | Pin drawing rev B → C; nest assembly rev C → D; BOM; spare list; maintenance manual (pin inspection monthly) |
| Disposition | Existing pins scrapped; supplier NCR and 8D |
| Effectivity | Machine serial 001 onward; spares stock replaced |
| Verification | FAT-08 repeated: position Cpk 1.6; wear check after 10,000 cycles |

### 47.8 Design trade-offs

| Trade-off | Option A | Option B | Guidance |
|---|---|---|---|
| Heavy vs light change process | Control | Speed | Light for Class II; full for Class I |
| Revision vs new part number | Simpler catalogue | Clear interchangeability | New number when not fully interchangeable |
| Immediate vs batched changes | Fast fixes | Fewer disruptions | Batch non-urgent changes into planned releases |

### 47.9 Common mistakes

- Red-lined drawings on the shop floor never formalized.
- Software changed at site without version change or record.
- Customer-requested changes implemented without price or schedule agreement.
- Safety validation not repeated after a change to guarding or safety logic.
- Spare-part stock not updated after a change.

### 47.10 Troubleshooting

| Symptom | Possible causes | Corrective action | Preventive action |
|---|---|---|---|
| Machine does not match drawings | Informal changes | Audit, formal ECNs, update as-built | Single change system; audits at gates |
| Wrong spare delivered | BOM or spare list not updated | Correct records, replace spare | ECN checklist includes spares |
| Disputes over extra cost | Changes without change orders | Negotiate, document | Change-order rule in contract |

### 47.11 Design checklist

- Baselines defined at G2, G3, FAT and SAT
- ECR/ECN workflow with classes and CCB
- Revision rules for drawings, BOM, software, recipes and documents
- Customer approval and change-order rules in contract
- Verification and safety re-validation for changes
- As-built and field-retrofit records per serial number

### 47.12 Key takeaways

- After design freeze, every change is a controlled decision.
- Assess impact across all disciplines, including safety and documents.
- Interchangeability decides revision versus new part number.
- Changes are cheap on paper and expensive in steel; decide early.
