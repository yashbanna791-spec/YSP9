// ===============================
// YSP9 SUPABASE
// ===============================

const SUPABASE_URL =
  "https://cwelkiqvnvyjgtryztgv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable__wxc6yDeapVr77Mz8tE_DA_4Z0dSpEa";

const supabaseClient =
  supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// ===============================
// YSP9 SEARCH SYSTEM
// ===============================

const searchBox =
  document.getElementById("searchBox");

if (searchBox) {

  searchBox.addEventListener("input", async function () {

    const value =
      this.value.trim().toLowerCase();

    const latestContainer =
      document.getElementById("latestNotes");

    if (!latestContainer) return;


    // Search empty hai to latest notes dikhao
    if (!value) {

      loadLatestNotes();

      return;
    }


    latestContainer.innerHTML =
      "<p style='text-align:center;'>🔎 Searching...</p>";


    const { data, error } =
      await supabaseClient
        .from("notes")
        .select("*")
        .or(
          `subject.ilike.%${value}%,chapter.ilike.%${value}%`
        )
        .order("created_at", {
          ascending: false
        });


    if (error) {

      console.error(error);

      latestContainer.innerHTML =
        "<p style='text-align:center;'>❌ Search failed.</p>";

      return;
    }


    if (!data || data.length === 0) {

      latestContainer.innerHTML =
        "<p style='text-align:center;'>📚 Koi notes nahi mile.</p>";

      return;
    }


    showNotes(data);

  });

}


// ===============================
// NOTE ICON
// ===============================

function getSubjectIcon(subject) {

  const value =
    subject.toLowerCase();

  if (value === "physics") return "📘";

  if (value === "chemistry") return "🧪";

  if (value === "biology") return "🌿";

  if (value === "english") return "📖";

  return "📚";

}


// ===============================
// SHOW NOTES
// ===============================

function showNotes(notes) {

  const container =
    document.getElementById("latestNotes");

  if (!container) return;


  container.innerHTML = "";


  notes.forEach(note => {

    const card =
      document.createElement("div");

    card.className = "card";


    const icon =
      getSubjectIcon(note.subject);


    card.innerHTML = `
      <h3>${icon} ${note.subject}</h3>

      <p>${note.chapter}</p>

      <a href="${note.pdf_path}" target="_blank">
        <button>📄 Open PDF</button>
      </a>
    `;


    container.appendChild(card);

  });

}


// ===============================
// LOAD LATEST NOTES
// ===============================

async function loadLatestNotes() {

  const container =
    document.getElementById("latestNotes");

  if (!container) return;


  const { data, error } =
    await supabaseClient
      .from("notes")
      .select("*")
      .order("created_at", {
        ascending: false
      });


  if (error) {

    console.error(error);

    container.innerHTML =
      "<p style='text-align:center;'>❌ Notes load nahi ho paaye.</p>";

    return;
  }


  if (!data || data.length === 0) {

    container.innerHTML =
      "<p style='text-align:center;'>📚 Abhi notes available nahi hain.</p>";

    return;
  }


  showNotes(
    data.slice(0, 5)
  );

}


// ===============================
// PDF UPLOAD SYSTEM
// ===============================

const uploadBtn =
  document.getElementById("uploadBtn");


if (uploadBtn) {

  uploadBtn.addEventListener(
    "click",
    async function () {

      const subject =
        document
          .getElementById("subject")
          .value
          .trim();


      const chapter =
        document
          .getElementById("chapter")
          .value
          .trim();


      const file =
        document
          .getElementById("pdfFile")
          .files[0];


      const status =
        document.getElementById("status");


      if (!subject || !chapter || !file) {

        status.innerText =
          "⚠️ Subject, Chapter aur PDF select karo.";

        return;
      }


      if (file.type !== "application/pdf") {

        status.innerText =
          "❌ Sirf PDF file upload karo.";

        return;
      }


      uploadBtn.disabled = true;

      status.innerText =
        "⏳ PDF upload ho rahi hai...";


      const safeSubject =
        subject
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");


      const safeChapter =
        chapter
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-");


      const fileName =
        Date.now() +
        "-" +
        file.name.replace(/\s+/g, "-");


      const filePath =
        safeSubject +
        "/" +
        safeChapter +
        "/" +
        fileName;


      // Upload PDF
      const { error: uploadError } =
        await supabaseClient
          .storage
          .from("pdfs")
          .upload(
            filePath,
            file,
            {
              contentType:
                "application/pdf",

              upsert: false
            }
          );


      if (uploadError) {

        console.error(uploadError);

        status.innerText =
          "❌ Upload failed: " +
          uploadError.message;

        uploadBtn.disabled = false;

        return;
      }


      // Public URL
      const { data } =
        supabaseClient
          .storage
          .from("pdfs")
          .getPublicUrl(filePath);


      const publicUrl =
        data.publicUrl;


      // Database me save
      const { error: databaseError } =
        await supabaseClient
          .from("notes")
          .insert({
            subject: subject,
            chapter: chapter,
            pdf_path: publicUrl
          });


      if (databaseError) {

        console.error(databaseError);

        status.innerText =
          "⚠️ PDF upload ho gayi, lekin database me save nahi hui: " +
          databaseError.message;

        uploadBtn.disabled = false;

        return;
      }


      status.innerHTML =
        "✅ PDF successfully upload ho gayi!<br><br>" +
        `<a href="${publicUrl}" target="_blank">
          📄 Open PDF
        </a>`;


      uploadBtn.disabled = false;

    }
  );

}


// ===============================
// SUBJECT PAGE NOTES
// ===============================

async function loadSubjectNotes() {

  const heading =
    document.querySelector("h1");

  if (!heading) return;


  const headingText =
    heading.innerText.toLowerCase();


  let currentSubject = "";


  if (headingText.includes("biology")) {
    currentSubject = "Biology";
  }

  else if (headingText.includes("physics")) {
    currentSubject = "Physics";
  }

  else if (headingText.includes("chemistry")) {
    currentSubject = "Chemistry";
  }

  else if (headingText.includes("english")) {
    currentSubject = "English";
  }


  if (!currentSubject) return;


  const container =
    document.querySelector(".subjects");


  if (!container) return;


  // Sirf un pages par jahan dynamic notes container hai
  const dynamicContainer =
    document.getElementById(
      currentSubject.toLowerCase() + "Notes"
    );


  if (!dynamicContainer) return;


  const { data, error } =
    await supabaseClient
      .from("notes")
      .select("*")
      .ilike("subject", currentSubject)
      .order("created_at", {
        ascending: true
      });


  if (error) {

    console.error(
      "Notes loading error:",
      error
    );

    return;
  }


  if (!data || data.length === 0) return;


  dynamicContainer.innerHTML = "";


  data.forEach(note => {

    const card =
      document.createElement("div");

    card.className = "card";


    const icon =
      getSubjectIcon(
        note.subject
      );


    card.innerHTML = `
      <h2>${icon} ${note.chapter}</h2>

      <p>Class 12 ${note.subject} Notes</p>

      <a href="${note.pdf_path}" target="_blank">
        <button>📄 Open PDF</button>
      </a>
    `;


    dynamicContainer.appendChild(card);

  });

}


// ===============================
// PAGE LOAD
// ===============================

loadLatestNotes();

loadSubjectNotes();  
