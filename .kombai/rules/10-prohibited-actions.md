# 10 - Prohibited Actions (Expanded)

Agent MUST NEVER:
- Create README.md or docs/ outside `.agent`.
- Commit credentials, API keys or secrets to repository.
- Use ORMs instead of raw better-sqlite3.
- Implement UI with any framework other than React + Tailwind.
- Skip PHASE checks or proceed without explicit user "تابع" approval.
- Modify the PDF source file; treat it as the authoritative spec.
