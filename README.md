# Navkar LGSF — Light Gauge Steel Frame Structures

A single-page high-performance parallax website for the LGSF vertical of **Navkar InfraSynergy Private Limited**, built from the `NISPL_LGSF_R1.pdf` presentation. Separate from the consulting site at [navkaris.com](https://navkaris.com/index.html).

---

## 📁 Project Structure

```
navkar-lgsf/
├── index.html                  # Main single-page HTML layout
├── css/style.css               # Full stylesheet (responsive, dark/light themes)
├── js/main.js                  # Parallax engine, reveals, tabs, theme toggle & form handling
├── assets/img/                 # Images extracted from source PDF and brand assets
└── .github/workflows/
    └── deploy.yml              # Automated build, branch sync & Hostinger deployment workflow
```

---

## 🚀 Running Locally & Previewing the Project

### Option 1: Direct Browser Launch (Fastest on Windows)
In PowerShell or Command Prompt, run:
```powershell
start index.html
```
*Or simply double-click `index.html` in your file explorer.*

### Option 2: Using Node (`npx.cmd` for Windows PowerShell)
In Windows PowerShell (bypasses script execution policy restrictions):
```powershell
npx.cmd -y http-server . -p 8080
```
*(Or in CMD: `cmd /c npx -y http-server . -p 8080`)*

Then open your browser at **[http://127.0.0.1:8080](http://127.0.0.1:8080)**.

### Option 3: Using Python (If Python is installed)
```bash
python -m http.server 8080
```
Then open **[http://127.0.0.1:8080](http://127.0.0.1:8080)**.

---

## ⚙️ Git & Commit Configuration

The repository is configured to use the official contact details for all Git commits:

- **Email:** `navkarengineersandconsultants1@gmail.com`
- **Author Name:** `Navkar Engineers and Consultants`

To apply this locally on your machine for this project:
```bash
git config user.email "navkarengineersandconsultants1@gmail.com"
git config user.name "Navkar Engineers and Consultants"
```

---

## 🌐 Automated GitHub Actions & Hostinger Deployment

The project includes an automated deployment pipeline configured in **[.github/workflows/deploy.yml](.github/workflows/deploy.yml)**.

### Branch Architecture & Flow
1. **`main` Branch:** Primary development branch. When you push changes to `main`:
   - GitHub Actions automatically runs the build process.
   - Pushes compiled build files to the **`production`** branch.
   - Automatically syncs the build files to Hostinger.
2. **`production` Branch:** Dedicated release branch connected to Hostinger deployment.

### Hostinger Deployment Setup
To enable deployment to Hostinger, configure the following Secrets in your GitHub Repository under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Example / Value |
|---|---|---|
| `FTP_SERVER` | Hostinger FTP Server IP or Hostname | `ftp.yourdomain.com` or Hostinger IP |
| `FTP_USERNAME` | Hostinger FTP Username | Hostinger account username |
| `FTP_PASSWORD` | Hostinger FTP Password | Hostinger account password |
| `FTP_PORT` *(Optional)* | FTP / SFTP Port | `21` (default) or `65002` |

---

## 🎨 Navigation & Theme Features

### Header Navigation
The top menu includes full section anchors for easy navigation:
- **Home** (`#home`)
- **About Us** (`#about`)
- **Technology** (`#technology`)
- **Advantage** (`#advantage`)
- **Applications** (`#applications`)
- **Specifications** (`#specs`)
- **Process** (`#process`)
- **Projects** (`#projects`)
- **Leadership** (`#team`)
- **Get a Quote** (`#contact`)

### Themes (Dark & Light)
Flipped by the toggle in the header. The initial load follows the visitor's OS setting (`prefers-color-scheme`), and subsequent choices are saved in `localStorage` (`nispl-theme`).

- Surface tint (`--w`) and photographic veil (`--k`) are managed via CSS custom properties in `css/style.css`.

---

## ✉️ Contact & Enquiry Form

The project enquiry form submits directly to the company email via `mailto:`:

- **Target Emails:** `jayendra.pathak@navkaris.com`, `nihar.nathwani@navkaris.com`, `navkarinfrasynergy@gmail.com`
- **Phone:** `+91 90332 91244` (Jayendra Pathak — Director), `+91 97277 33126` (Nihar Nathwani — Strategic Partner - Sales)
- **Location:** Vadodara, Gujarat, India

To connect the form to a server-side endpoint (e.g. Formspree, Web3Forms), edit the form submit listener at the bottom of `js/main.js`.
