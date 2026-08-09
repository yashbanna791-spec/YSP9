// ===============================
// YSP9 SEARCH SYSTEM
// ===============================

const searchBox = document.getElementById("searchBox");

if (searchBox) {
  searchBox.addEventListener("keyup", function () {
    const value = this.value.toLowerCase();
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
      const text = card.innerText.toLowerCase();

      card.style.display =
        text.includes(value) ? "block" : "none";
    });
  });
}


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
// PDF UPLOAD SYSTEM
// ===============================

const uploadBtn = document.getElementById("uploadBtn");

if (uploadBtn) {

  uploadBtn.addEventListener("click", async function () {

    const subject =
      document.getElementById("subject").value.trim();

    const chapter =
      document.getElementById("chapter").value.trim();

    const file =
      document.getElementById("pdfFile").files[0];

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
      subject.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const safeChapter =
      chapter.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const fileName =
      Date.now() + "-" + file.name.replace(/\s+/g, "-");

    const filePath =
      safeSubject + "/" + safeChapter + "/" + fileName;


    // Upload PDF
    const { error: uploadError } =
      await supabaseClient.storage
        .from("pdfs")
        .upload(filePath, file, {
          contentType: "application/pdf",
          upsert: false
        });

    if (uploadError) {

      console.error(uploadError);

      status.innerText =
        "❌ Upload failed: " +
        uploadError.message;

      uploadBtn.disabled = false;
      return;
    }


    // Get public URL
    const { data } =
      supabaseClient.storage
        .from("pdfs")
        .getPublicUrl(filePath);

    const publicUrl =
      data.publicUrl;


    // Save information in database
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

  });
}


// ===============================
// LOAD NOTES AUTOMATICALLY
// ===============================

async function loadNotes() {

  const cards =
    document.querySelectorAll(".card");

  if (!cards.length) return;


  // Current page ka subject identify karo
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

  if (!currentSubject) return;


  // Database se notes lao
  const { data: notes, error } =
    await supabaseClient
      .from("notes")
      .select("*")
      .eq("subject", currentSubject);


  if (error) {

    console.error("Notes loading error:", error);

    cards.forEach(card => {

      const button =
        card.querySelector("button");

      if (button) {
        button.innerText =
          "Notes load nahi ho rahe";
      }

    });

    return;
  }


  // Har chapter ko check karo
  cards.forEach(card => {

    const chapterHeading =
      card.querySelector("h2");

    const button =
      card.querySelector("button");

    if (!chapterHeading || !button) return;


    const chapterText =
      chapterHeading.innerText.toLowerCase();


    const match =
      chapterText.match(/\d+/);

    if (!match) return;

    const chapterNumber =
      match[0];


    // Database me same chapter dhundo
    const note =
      notes.find(item => {

        const dbChapter =
          String(item.chapter).toLowerCase();

        const dbMatch =
          dbChapter.match(/\d+/);

        return dbMatch &&
               dbMatch[0] === chapterNumber;

      });


    if (note) {

      button.innerText =
        "📄 Open PDF";

      button.onclick = function () {
        window.open(
          note.pdf_path,
          "_blank"
        );
      };

    }

    else {

      button.innerText =
        "Coming Soon";

      button.onclick = null;

    }

  });

}


// Page load hote hi notes check karo
loadNotes();
