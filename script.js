// ===============================
// YSP9 SUPABASE
// ===============================

const SUPABASE_URL =
  "https://cwelkiqvnvyjgtryztgv.supabase.co";

const SUPABASE_KEY =
  "sb_publishable__wxc6yDeapVr77Mz8tE_DA_4Z0dSpEa";

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ===============================
// SHOW NOTES
// ===============================

function showNotes(notes) {

  const container =
    document.getElementById("latestNotes");

  if (!container) return;

  container.innerHTML = "";

  if (!notes || notes.length === 0) {

    container.innerHTML =
      "<p style='text-align:center;'>📚 Koi notes nahi mile.</p>";

    return;
  }

  notes.forEach(note => {

    const card =
      document.createElement("div");

    card.className = "card";

    let icon = "📚";

    const subject =
      String(note.subject).toLowerCase();

    if (subject === "physics") icon = "📘";
    if (subject === "chemistry") icon = "🧪";
    if (subject === "biology") icon = "🌿";
    if (subject === "english") icon = "📖";

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
// LOAD ALL NOTES
// ===============================

async function getAllNotes() {

  const { data, error } =
    await supabaseClient
      .from("notes")
      .select("*")
      .order("created_at", {
        ascending: false
      });

  if (error) {

    console.error(
      "SUPABASE ERROR:",
      error
    );

    const container =
      document.getElementById("latestNotes");

    if (container) {

      container.innerHTML =
        `<p style="text-align:center;">
          ❌ Notes load nahi hue.<br>
          ${error.message}
        </p>`;

    }

    return [];
  }

  return data || [];

}


// ===============================
// HOME PAGE
// ===============================

async function setupHomePage() {

  const container =
    document.getElementById("latestNotes");

  if (!container) return;

  const notes =
    await getAllNotes();

  const total =
    document.getElementById("totalNotes");

  if (total) {
    total.innerText =
      notes.length;
  }

  showNotes(
    notes.slice(0, 5)
  );

  const searchBox =
    document.getElementById("searchBox");

  if (searchBox) {

    searchBox.addEventListener(
      "input",
      function () {

        const value =
          this.value
            .trim()
            .toLowerCase();

        if (!value) {

          showNotes(
            notes.slice(0, 5)
          );

          return;
        }

        const results =
          notes.filter(note => {

            const subject =
              String(note.subject)
                .toLowerCase();

            const chapter =
              String(note.chapter)
                .toLowerCase();

            return (
              subject.includes(value) ||
              chapter.includes(value)
            );

          });

        showNotes(results);

      }
    );

  }

}


// ===============================
// CONTACT FORM
// ===============================

function setupContactForm() {

  const form =
    document.getElementById(
      "contactForm"
    );

  if (!form) return;

  form.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();

      const name =
        document.getElementById(
          "name"
        ).value.trim();

      const email =
        document.getElementById(
          "email"
        ).value.trim();

      const message =
        document.getElementById(
          "message"
        ).value.trim();

      const status =
        document.getElementById(
          "contactStatus"
        );


      if (!name ||
          !email ||
          !message) {

        status.innerText =
          "⚠️ Please sabhi details bharo.";

        return;
      }


      status.innerText =
        "⏳ Message send ho raha hai...";


      const {
        error
      } =
      await supabaseClient
        .from("contact_messages")
        .insert({

          name: name,

          email: email,

          message: message

        });


      if (error) {

        console.error(
          "CONTACT ERROR:",
          error
        );

        status.innerText =
          "❌ Message send nahi hua: " +
          error.message;

        return;
      }


      status.innerText =
        "✅ Message successfully send ho gaya!";


      form.reset();

    }
  );

}


// ===============================
// START
// ===============================

setupHomePage();

setupContactForm();
