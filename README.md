# 📰 Fake News Detector

An **AI-assisted Fake News & Misinformation Detection** web application currently being developed to analyze news articles and provide a **credibility signal** rather than simply labeling content as “Fake” or “Real.”

The system is being designed to analyze article content, extract important claims, evaluate source credibility, and cross-check information with external fact-checking and news sources.

> 🚧 **Project Status: Under Development**
> This project is currently being built by **SOUROV BOMATRA** and **IMRAN AHMAD MIR**. Some features may be incomplete, unavailable, or subject to change as development continues.

---

## 👨‍💻 Authors

**SOUROV BOMATRA**
**IMRAN AHMAD MIR**

This project is being collaboratively developed by **SOUROV BOMATRA** and **IMRAN AHMAD MIR** as an AI-assisted tool for analyzing news credibility and detecting potential misinformation.

---

## 🚧 Project Status

**Currently in Development**

The project is **not completed yet**. We are actively working on the frontend, backend, AI analysis pipeline, source verification, and overall user experience.

### Current Development Areas

* [x] Initial project structure
* [x] Frontend development started
* [x] Backend development started
* [ ] Complete article extraction
* [ ] Complete AI claim analysis
* [ ] Complete fact-check integration
* [ ] Complete source credibility analysis
* [ ] Improve credibility scoring
* [ ] Complete dashboard and visualizations
* [ ] Testing and debugging
* [ ] Production deployment

Features and functionality may change as the project progresses.

---

## ✨ Planned Features

* 🔎 **News Article Analysis**

  * Enter a news article URL or paste article text.
  * Extract and analyze article content.

* 🤖 **AI-Powered Claim Analysis**

  * Identify important factual claims.
  * Analyze language, tone, and potential misinformation indicators.

* 📊 **Credibility Score**

  * Generate an overall credibility signal based on multiple factors.

* 📰 **Source Credibility**

  * Evaluate the reputation of the publishing source.

* ✅ **Fact-Check Cross-Referencing**

  * Compare claims with available fact-checking information.

* 🔗 **News Source Corroboration**

  * Look for supporting information from other news sources.

* 📋 **Claim-by-Claim Breakdown**

  * Display individual claims and the reasoning behind their assessment.

* 🎨 **Modern Dashboard UI**

  * Provide a clean, responsive, and user-friendly interface.

---

## 🧠 How It Is Designed to Work

The application is being developed around the following analysis pipeline:

```text
User Input
    ↓
Article Extraction
    ↓
Content Cleaning
    ↓
AI Claim Extraction
    ↓
Claim & Language Analysis
    ↓
Fact-Check Cross-Referencing
    ↓
Source Credibility Analysis
    ↓
Corroborating News Search
    ↓
Credibility Score
    ↓
Detailed Analysis Report
```

### 1. Input

The user will be able to provide:

* News article URL
* OR raw article text

### 2. Article Extraction

The backend is designed to extract useful information such as:

* Article title
* Author
* Publication date
* Main article content

### 3. Claim Analysis

The AI system is being designed to identify important factual claims and analyze:

* Language
* Tone
* Sources
* Potential red flags
* Unsupported statements

### 4. Cross-Referencing

Claims will be compared with:

* Fact-check databases
* Other news sources
* Available corroborating information

### 5. Source Analysis

The publishing domain will be evaluated using source credibility information and other available domain signals.

### 6. Final Result

The planned result will include:

* Overall credibility signal
* Source reputation
* Claim-by-claim analysis
* Supporting information
* Reasoning behind the result

---

## 🛠️ Tech Stack

### Frontend

* **Next.js 14**
* **React**
* JavaScript / TypeScript
* CSS
* Responsive UI
* Vercel

### Backend

* **FastAPI**
* **Python**
* `trafilatura` for article extraction
* LLM-based claim analysis
* Google Fact Check Tools API
* News API integration

### Database

* **SQLite** — Development
* **PostgreSQL** — Planned for production

---

## 📁 Project Structure

```text
Fake-News-Detector/
│
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend-build-prompt.md
├── frontend-build-prompt-v3.md
├── frontend-polish-prompt.md
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

> ⚠️ **Note:** The project is currently under development. Setup instructions and required dependencies may change during development.

### Prerequisites

Make sure you have the following installed:

* Node.js 18+
* Python 3.10+
* Git
* Required API keys

---

## ⚙️ Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create a Python virtual environment:

```bash
python -m venv venv
```

### Windows

```bash
venv\Scripts\activate
```

### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create your environment file:

```bash
cp .env.example .env
```

For Windows, you can also create the `.env` file manually.

Add the required API keys to `.env`.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend will normally run at:

```text
http://localhost:8000
```

---

## 💻 Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:3000
```

---

## 🔐 Environment Variables

Create a `.env` file and configure the required API keys.

| Variable              | Used In  | Purpose                                  |
| --------------------- | -------- | ---------------------------------------- |
| `ANTHROPIC_API_KEY`   | Backend  | LLM-based claim extraction and reasoning |
| `FACTCHECK_API_KEY`   | Backend  | Fact-checking API access                 |
| `NEWS_API_KEY`        | Backend  | News source corroboration                |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend API URL                          |

> 🔒 **Security:** Never commit your `.env` file or API keys to GitHub.

---

## 📊 Credibility Analysis

The application is **not designed to simply classify an article as:**

```text
FAKE ❌
REAL ✅
```

Instead, the goal is to provide a more detailed credibility signal based on multiple factors:

```text
┌─────────────────────────────┐
│     Credibility Signal      │
├─────────────────────────────┤
│                             │
│  Source Reputation          │
│  Claim Evidence             │
│  Fact-Check Results         │
│  Corroborating Sources      │
│  Language & Tone            │
│  Article Signals            │
│                             │
└──────────────┬──────────────┘
               ↓
      Overall Credibility
```

The goal is to make the system more informative than a simple binary “fake/real” classifier.

---

## 🎯 Intended Use Cases

The project is being developed for:

* Students researching online information
* Readers evaluating news articles
* Journalists conducting preliminary research
* Researchers studying misinformation
* Developers experimenting with AI-powered fact analysis
* Anyone interested in critically evaluating online information

---

## 🔮 Future Roadmap

* [ ] Expand source credibility database
* [ ] Improve claim-by-claim fact checking
* [ ] Domain age / WHOIS analysis
* [ ] Reverse image search
* [ ] Browser extension
* [ ] Community reporting and flagging
* [ ] Improved AI reasoning
* [ ] Multi-language article analysis
* [ ] Historical analysis of previously checked articles
* [ ] Advanced visualization and analytics
* [ ] Production deployment

---

## ⚠️ Disclaimer

This application is an **AI-assisted research and analysis tool under development**.

Its results should not be treated as a definitive determination that an article is true or false.

Satire, opinion articles, breaking news, incomplete reporting, and developing stories may produce misleading or lower credibility signals.

For important decisions, always verify information using **reliable primary sources and established fact-checking organizations**.

---

## 🤝 Contributing

Since this project is currently under development, contributions, suggestions, and feedback are welcome.

If you would like to contribute:

### 1. Fork the repository

Create your own fork of the project.

### 2. Create a new branch

```bash
git checkout -b feature/your-feature
```

### 3. Make your changes

Implement your feature or improvement.

### 4. Commit your changes

```bash
git add .
git commit -m "Add new feature"
```

### 5. Push your branch

```bash
git push origin feature/your-feature
```

### 6. Open a Pull Request

Submit your Pull Request for review.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## ⭐ Support

If you find this project interesting, consider giving the repository a ⭐ on GitHub.

---

## 👥 Project Team

### SOUROV BOMATRA

Developer & Project Contributor

### IMRAN AHMAD MIR

Developer & Project Contributor

---

### 🚀 Currently Building

**Fake News Detector is actively under development.**

We are continuously working on improving the AI analysis, credibility scoring, user interface, fact-checking capabilities, and overall reliability of the system.

---

### Built with ❤️ using

**Next.js • React • Python • FastAPI • AI**
