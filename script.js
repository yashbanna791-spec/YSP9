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

      if (text.includes(value)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
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
// PDF UPLOAD
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


    // ===============================
    // UPLOAD PDF TO STORAGE
    // ===============================

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
        "❌ Upload failed: " + uploadError.message;

      uploadBtn.disabled = false;
      return;
    }


    // ===============================
    // GET PUBLIC PDF URL
    // ===============================

    const { data } =
      supabaseClient.storage
        .from("pdfs")
        .getPublicUrl(filePath);


    const publicUrl =
      data.publicUrl;


    // ===============================
    // SAVE NOTE INFORMATION
    // ===============================

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
        "⚠️ PDF upload ho gayi, lekin notes database me save nahi hua: " +
        databaseError.message;

      uploadBtn.disabled = false;
      return;
    }


    // ===============================
    // SUCCESS
    // ===============================

    status.innerHTML =
      "✅ PDF successfully upload ho gayi!<br><br>" +
      `<a href="${publicUrl}" target="_blank">
        📄 Open PDF
      </a>`;


    uploadBtn.disabled = false;

  });

}
