"""Smoke test: analisis beberapa CV contoh tanpa menjalankan server.

Jalankan dari folder services/ml:
    .venv\\Scripts\\python.exe -m scripts.smoke_test
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.analyzer import ValidationFailed, analyze_text  # noqa: E402

SAMPLES = {
    "Software Engineer": """Andi Pratama
Software Engineer | Full Stack Developer
Email: andi.pratama@example.com | Phone: +62 812 3456 7890 | linkedin.com/in/andipratama

Summary
Full stack software engineer with 5 years of experience building web applications and
backend services for e-commerce and fintech products. Comfortable owning features end to
end, from database schema to production deployment.

Skills
JavaScript, TypeScript, React, Node.js, Express, HTML, CSS, Python, SQL, PostgreSQL,
Docker, AWS, Git, REST API, Unit Testing, Agile, Scrum, Jira.

Experience
Senior Software Engineer, Toko Online Indonesia — 2021 to present
- Developed responsive user interfaces with React and TypeScript used by 120,000 monthly users.
- Built REST API services with Node.js and Express serving 3 million requests per day.
- Migrated legacy monolith to Docker containers on AWS, reducing deployment time by 70 percent.
- Implemented unit testing pipeline with Git and GitHub Actions, raising coverage to 85 percent.
- Mentored three junior engineers and led sprint planning in an Agile team.

Software Engineer, Fintech Nusantara — 2019 to 2021
- Designed PostgreSQL schemas and optimized SQL queries, cutting report latency by 40 percent.
- Developed internal dashboard with React consumed by the operations team.

Education
Bachelor of Computer Science, Universitas Indonesia, 2019
""",
    "Accountant": """Jane Smith
Senior Accountant
Email: jane.smith@example.com | Phone: +62 811 2233 4455 | linkedin.com/in/janesmith

Summary
Detail oriented accountant with 6 years of experience in financial reporting, tax compliance
and audit support for manufacturing and retail companies. Strong in reconciliation, general
ledger management and budgeting.

Skills
Accounting, Financial Reporting, Reconciliation, General Ledger, Tax, Auditing, Budgeting,
Financial Analysis, Accounts Payable, Accounts Receivable, Payroll, Excel, SAP, Communication.

Experience
Senior Accountant, Retail Group — 2020 to present
- Prepared monthly financial statements and reconciliations using Excel and SAP.
- Managed general ledger close process and reduced closing time from 12 to 6 working days.
- Assisted external audit and prepared tax filing documents for annual compliance.
- Performed variance analysis and budgeting with the finance team across 4 business units.
- Supervised accounts payable and receivable staff of 3 people.

Junior Accountant, Manufacturing Co — 2018 to 2020
- Handled journal entries, bank reconciliation and cost accounting reports.
- Supported payroll processing for 250 employees.

Education
Bachelor of Accounting, Universitas Padjadjaran, 2018
Certification: Brevet A and B
""",
    "Chef": """Marco Rossi
Executive Chef
Email: marco.rossi@example.com | Phone: +62 813 5566 7788

Summary
Creative chef with 10 years of experience in Italian fine dining and high volume kitchens.
Focused on menu development, food cost control and kitchen team leadership.

Skills
Cooking, Chef, Kitchen Management, Menu Planning, Food Safety, HACCP, Food Cost, Baking,
Inventory Management, Leadership, Teamwork, Communication, Training and Development.

Experience
Executive Chef, Villa Italia — 2019 to present
- Led kitchen brigade of 15 cooks and managed daily operations for 200 covers.
- Designed seasonal menus that increased average spend per guest by 18 percent.
- Controlled food cost and inventory management, reducing waste by 22 percent.
- Implemented food safety and HACCP standards across the kitchen.
- Trained junior chefs and coordinated with suppliers.

Sous Chef, Grand Hotel — 2015 to 2019
- Supervised pastry and baking section, prepared menu planning for banquets.
- Managed kitchen staff scheduling and inventory.

Education
Culinary Arts Diploma, Sekolah Tinggi Pariwisata, 2014
""",
    "Data Analyst": """Budi Santoso
Data Analyst
Email: budi.santoso@example.com | Phone: +62 812 9988 7766 | linkedin.com/in/budisantoso

Summary
Statistics graduate with two years of experience as a data analyst in an e-commerce company.
Focused on turning raw data into dashboards and recommendations the business team can act on.

Skills
Data Analysis, Data Visualization, Python, SQL, Excel, Power BI, Tableau, Statistics,
Machine Learning, Pandas, Communication, Teamwork, Problem Solving.

Experience
Data Analyst, E-commerce Group — 2023 to present
- Analyzed weekly sales data with SQL and Python and built dashboards in Power BI.
- Developed customer behaviour analysis that improved checkout conversion by 12 percent.
- Automated monthly reporting pipeline, saving 20 hours of manual work per month.
- Presented findings to non-technical stakeholders and product managers.

Data Analyst Intern, Retail Co — 2022 to 2023
- Performed data cleaning and data visualization for marketing campaign reporting.
- Supported A/B testing analysis for pricing experiments.

Education
Bachelor of Statistics, Universitas Indonesia, 2022
""",
}


def main() -> None:
    for name, text in SAMPLES.items():
        print("=" * 78)
        print(name)
        print("=" * 78)
        try:
            result = analyze_text(text)
        except ValidationFailed as exc:
            print("DITOLAK:", exc.result.reasons)
            print()
            continue
        print(f"Skor          : {result['overall_score']} ({result['grade']})")
        print(f"Role          : {result['predicted']['role']}")
        print(f"Keluarga      : {result['predicted']['family_label']}")
        print(f"Confidence    : {result['predicted']['confidence']*100:.1f}%")
        print(f"Low conf      : {result['is_low_confidence']}")
        print(f"Breakdown     : {json.dumps(result['breakdown'])}")
        print("Career match  :")
        for m in result["career_matches"][:3]:
            print(f"   - {m['label']:34s} {m['match']:5.1f}%")
        jobs = result.get("job_matches", [])
        print("3 profesi     :")
        for i, m in enumerate(jobs, start=1):
            print(f"   {i}. {m['role']:34s} {m['match']:5.1f}%  ({m['family_label']})")
        assert len(jobs) == 3, f"harus 3 profesi, dapat {len(jobs)}"
        assert jobs[0]["role"] == result["predicted"]["role"], (
            "profesi peringkat 1 harus sama dengan predicted.role"
        )
        print(f"Skill gap     : kurang {result['skill_gap']['missing']}")
        print(f"Strengths     : {result['strengths'][:2]}")
        print(f"Weaknesses    : {result['weaknesses'][:2]}")
        print()


if __name__ == "__main__":
    main()
