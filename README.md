# 📊 Dynamic Report Creation Tool

A full-stack web application that allows users to dynamically create, manage, and view reports. Built with Angular (frontend), Node.js/Express (backend), and PostgreSQL (database).

## 🚀 Features

- Create and customize reports dynamically
- Filter, sort, and export report data
- Responsive UI built with Angular
- RESTful API with Node.js and Express
- PostgreSQL for robust data handling
- Authentication and role-based access (optional)
- Download reports in PDF/CSV formats (optional)

---

## 🧱 Tech Stack

| Layer       | Technology        |
|-------------|-------------------|
| Frontend    | Angular           |
| Backend     | Node.js + Express |
| Database    | PostgreSQL        |
| ORM         | Sequelize / TypeORM (optional) |

---

## 📦 Prerequisites

- Node.js (v16+)
- PostgreSQL (v13+)
- Angular CLI (v15+)
- Git

---

## ⚙️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/dynamic-report-tool.git
cd dynamic-report-tool

```
### 2. Backend Setup (/server)
cd server
npm install
cp .env.example .env
npx sequelize db:migrate
npm run dev

Environment Variables(.env)
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=youruser
DB_PASSWORD=yourpassword
DB_NAME=reportdb



### 3. Frontend  Setup (/dynamic-report-app)

cd ../dynamic-report-app
npm install
ng serve



📦 Project Structure
/dynamic-report-app       → Angular frontend
/server                   → Node.js + Express backend
README.md                 → Project documentation



🧪 Testing
1. Backend Testing
    → cd server
    → npm run test

2. Frontend Testing 
   → cd client
   → ng test

📝 Usage
1.Visit the homepage and login (if auth is enabled).
2.Navigate to the Reports section.
3.Use the dynamic form to define report filters, columns, and output format.
4.Click Generate Report to view or export.

🤝 Contributions
Feel free to fork and contribute via pull requests.

📧 Contact
For queries or support: singhbanti9900@gmail.com
