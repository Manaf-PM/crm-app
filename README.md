# Wealth Advisor CRM (Lightweight Client Engagement Platform)

A lightweight, automation-first CRM designed for wealth advisors who need simplicity, efficiency, and high-value client engagement — without the complexity of traditional tools like Salesforce.

---

## Overview

This project was built from a real-world observation:

A wealth advisor using Salesforce was paying a high cost while leveraging only a small fraction of its capabilities.

The core issue wasn’t a lack of features — it was over-complexity.

This project explores a simpler approach:
👉 focus on the few actions that actually create value

- managing clients
- maintaining relationships
- triggering meaningful interactions at the right time

---

## Problem

Wealth advisors often rely on tools that are:

- too complex for their actual needs  
- expensive relative to usage  
- poorly adopted in daily workflows  

As a result:
- client data is underused  
- engagement is inconsistent  
- opportunities are missed  

---

## Solution

This application focuses on a minimal but high-impact workflow:

- centralize client information  
- enable structured communication  
- automate key interactions  

The goal is not to replicate a full CRM, but to deliver:

👉 simplicity  
👉 clarity  
👉 automation where it matters  

---

## Key Features

- Client management (CRUD)
- Email template creation
- Automated email campaigns (via Brevo)
- Scheduled engagement workflows (e.g. birthday emails)
- SMS automation (in progress)

---

## How it works

The system is built around client lifecycle and engagement:

1. Clients are stored and managed in a centralized database  
2. Templates are created for recurring communications  
3. Automated jobs trigger emails based on predefined rules  
4. Future extension: SMS integration for multi-channel engagement  

---

## Tech Stack

Frontend — Next.js 14 (App Router) + Tailwind CSS + React Query + Axios + Firebase Auth
Backend — Hono + Drizzle ORM + Firebase Admin + Nodemailer + Twilio
Database — PostgreSQL hosted on Supabase
External services — Brevo (SMTP email) + Twilio (SMS)
Monorepo — npm workspaces + Turborepo with 4 packages: frontend, backend, shared, jobs


## Project Structure
# Wealth Advisor CRM (Lightweight Client Engagement Platform)

A lightweight, automation-first CRM designed for wealth advisors who need simplicity, efficiency, and high-value client engagement — without the complexity of traditional tools like Salesforce.

---

---

## Current Status

MVP functional:

- client management ✔  
- email automation ✔  
- SMS integration 🚧 (in progress)  

---

## Key Takeaways

This project demonstrates:

- the ability to identify a real user problem  
- translating that problem into a focused product  
- prioritizing simplicity over feature overload  
- designing for adoption, not just capability  

---

## Future Improvements

- SMS automation (in progress)  
- campaign analytics  
- client segmentation  
- interaction history tracking  
- portfolio-level insights  

---

## Author

Built by Manaf El Mezraoui