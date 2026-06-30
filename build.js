const fs = require("fs");
const path = require("path");

// GitHub repository configuration
const GITHUB_OWNER = "srinath-tripathy";
const GITHUB_REPO = "blog.github.io";
const GITHUB_BRANCH = "main";
const GITHUB_BASE_URL = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/${GITHUB_BRANCH}`;

// Crucial fix: Automatically create directories if they don't exist
if (!fs.existsSync("./personal_stupid_thoughts"))
  fs.mkdirSync("./personal_stupid_thoughts");
if (!fs.existsSync("./learnings")) fs.mkdirSync("./learnings");
if (!fs.existsSync("./dist")) fs.mkdirSync("./dist");

function getPostsFromDir(dirPath, uniquePrefix) {
  let htmlContent = "";
  let modalContent = "";

  // Safely read files, default to empty array if something goes wrong
  let files = [];
  try {
    files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".md"));
  } catch (e) {
    console.log(`Directory ${dirPath} could not be read.`);
  }

  if (files.length === 0) {
    return { html: "", modals: "" };
  }

  files.forEach((file, index) => {
    try {
      const content = fs.readFileSync(path.join(dirPath, file), "utf-8");
      if (!content.trim()) return; // Skip empty files

      const lines = content.split("\n");
      const date = lines[0] || "Unknown Date";

      let body = lines.slice(1).join("\n").trim();
      let title = file.split(".md")[0];

      if (body.startsWith("### ")) {
        const linesOfBody = body.split("\n");
        title = linesOfBody[0].replace("### ", "");
        body = linesOfBody.slice(1).join("\n").trim();
      }

      const postId = `${uniquePrefix}-${index}`;
      const cleanText = body.replace(/<[^>]*>/g, "");
      const previewText =
        cleanText.length > 30 ? cleanText.substring(0, 30) + "..." : cleanText;

      // Generate GitHub URL for the markdown file
      const githubFileUrl = `${GITHUB_BASE_URL}/${dirPath}/${file}`;

      htmlContent += `
            <article class="post-preview" onclick="redirectToGitHub('${githubFileUrl}')">
                <span class="date">${date.trim()}</span>
                <h3><a href="#" class="post-link">${title.trim()}</a></h3>
                <p class="preview-text">${previewText.replace(/\n/g, " ")}</p>
            </article>\n`;

      modalContent += `
            <div id="modal-${postId}" class="modal-overlay" onclick="closePost('${postId}')">
                <div class="modal-card" onclick="event.stopPropagation()">
                    <button class="close-btn" onclick="closePost('${postId}')">✕ Close</button>
                    <span class="date">${date.trim()}</span>
                    <h2>${title.trim()}</h2>
                    <div class="modal-body">${body.replace(/\n/g, "<br>")}</div>
                </div>
            </div>\n`;
    } catch (fileErr) {
      console.error(`Error processing file ${file}:`, fileErr);
    }
  });

  return { html: htmlContent, modals: modalContent };
}

const thoughtsData = getPostsFromDir("./personal_stupid_thoughts", "thought");
const learningsData = getPostsFromDir("./learnings", "learning");

const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Stupid Space</title>
    <style>
        :root {
            --bg-color: #000000; --card-bg: #121212; --text-color: #e0e0e0;
            --text-muted: #888888; --border-color: #333333;
            --accent-thoughts: #ff6b6b; --accent-learnings: #4dadf7;
            --btn-bg: #ffffff; --btn-text: #000000;
            --modal-bg: rgba(0, 0, 0, 0.85);
        }
        [data-theme="light"] {
            --bg-color: #f4f1ea; --card-bg: #ffffff; --text-color: #2b2b2b;
            --text-muted: #666666; --border-color: #333333;
            --btn-bg: #000000; --btn-text: #ffffff;
            --modal-bg: rgba(244, 241, 234, 0.85);
        }
        body { font-family: 'Courier New', Courier, monospace; background-color: var(--bg-color); color: var(--text-color); line-height: 1.6; margin: 0; padding: 20px; transition: background-color 0.3s ease; }
        header { text-align: center; border-bottom: 3px solid var(--border-color); padding-bottom: 20px; margin-bottom: 40px; }
        h1 { margin: 0; font-size: 2.5rem; }
        .subtitle { font-style: italic; margin-top: 5px; color: var(--text-muted); }
        .theme-toggle-btn { background-color: var(--btn-bg); color: var(--btn-text); border: 2px solid var(--border-color); padding: 10px 15px; font-family: inherit; font-weight: bold; cursor: pointer; margin-top: 15px; border-radius: 4px; transition: all 0.2s ease; }
        .theme-toggle-btn:hover { opacity: 0.8; }
        .container { display: grid; grid-template-columns: 1fr; gap: 40px; max-width: 1200px; margin: 0 auto; }
        @media (min-width: 768px) { .container { grid-template-columns: 1fr 1fr; } }
        section { background: var(--card-bg); border: 3px solid var(--border-color); border-radius: 8px; padding: 20px; box-shadow: 5px 5px 0px var(--border-color); }
        .thoughts-section { border-top: 15px solid var(--accent-thoughts); }
        .learnings-section { border-top: 15px solid var(--accent-learnings); }
        h2 { margin-top: 0; font-size: 1.8rem; border-bottom: 2px dashed var(--border-color); padding-bottom: 10px; }
        .post-preview { 
            margin-bottom: 25px; 
            padding-bottom: 15px; 
            border-bottom: 1px dashed var(--border-color); 
            cursor: pointer; 
            transition: all 0.2s ease;
            padding: 15px;
            border-radius: 4px;
        }
        .post-preview:hover { 
            transform: translateX(5px);
            background-color: rgba(255, 107, 107, 0.1);
            border-left: 3px solid var(--accent-thoughts);
            padding-left: 12px;
        }
        .post-preview:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
        .post-link { color: var(--text-color); text-decoration: none; }
        .post-preview:hover .post-link { text-decoration: underline; }
        .preview-text { margin: 5px 0 0 0; color: var(--text-muted); font-size: 0.95rem; }
        .date { font-size: 0.85rem; font-weight: bold; color: var(--text-muted); display: block; margin-bottom: 5px; }
        .modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--modal-bg); z-index: 1000; justify-content: center; align-items: center; padding: 20px; }
        .modal-card { background: var(--card-bg); border: 4px solid var(--border-color); width: 100%; max-width: 700px; padding: 30px; box-sizing: border-box; border-radius: 8px; box-shadow: 8px 8px 0px var(--border-color); position: relative; }
        .close-btn { position: absolute; top: 15px; right: 15px; background: var(--btn-bg); color: var(--btn-text); border: 2px solid var(--border-color); padding: 5px 10px; font-family: inherit; font-weight: bold; cursor: pointer; border-radius: 3px; transition: all 0.2s ease; }
        .close-btn:hover { opacity: 0.8; }
        .modal-body { margin-top: 20px; font-size: 1.1rem; border-top: 2px dashed var(--border-color); padding-top: 20px; }
        footer { text-align: center; margin-top: 60px; font-size: 0.9rem; color: var(--text-muted); }
        body.modal-open { overflow: hidden; }
    </style>
</head>
<body>
    <header>
        <h1>Welcome to My Brain</h1>
        <div class="subtitle">A curation of high-purity nonsense.</div>
        <button class="theme-toggle-btn" id="themeToggle">💡 Mode</button>
    </header>
    <main class="container">
        <section class="thoughts-section">
            <h2>🧠 Stupid Personal Thoughts</h2>
            ${thoughtsData.html || "<p>No thoughts yet. Brain completely empty.</p>"}
        </section>
        <section class="learnings-section">
            <h2>💡 Stupid Learnings</h2>
            ${learningsData.html || "<p>No learnings yet. Still baseline stupid.</p>"}
        </section>
    </main>

    <div id="modal-container">
        ${thoughtsData.modals}
        ${learningsData.modals}
    </div>

    <footer><p>© 2026 Made with lack of sleep and poor judgment.</p></footer>
    
    <script>
        function redirectToGitHub(url) {
            window.open(url, '_blank');
        }
        
        function openPost(id) {
            document.getElementById('modal-' + id).style.display = 'flex';
            document.body.classList.add('modal-open');
        }
        
        function closePost(id) {
            document.getElementById('modal-' + id).style.display = 'none';
            document.body.classList.remove('modal-open');
            if(window.location.hash === '#' + id) {
                history.replaceState(null, null, ' ');
            }
        }
        
        window.addEventListener('load', () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && document.getElementById('modal-' + hash)) {
                openPost(hash);
            }
        });
        
        const btn = document.getElementById('themeToggle');
        if (localStorage.getItem('theme') === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            btn.textContent = '🌙 Mode';
        }
        btn.addEventListener('click', () => {
            if (document.documentElement.getAttribute('data-theme') === 'light') {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'dark');
                btn.textContent = '💡 Mode';
            } else {
                document.documentElement.setAttribute('data-theme', 'light');
                localStorage.setItem('theme', 'light');
                btn.textContent = '🌙 Mode';
            }
        });
    </script>
</body>
</html>`;

fs.writeFileSync("./index.html", template);
console.log("Build finished successfully!");
