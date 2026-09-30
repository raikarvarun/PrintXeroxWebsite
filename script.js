
// ========================================
// CONFIGURATION
// ========================================

// For local testing:
const API_URL = " https://beautifully-applied-figure-gauge.trycloudflare.com";


// ========================================
// STATE
// ========================================

let selectedFile = null;
let copies = 1;
let colorMode = "B&W";


// ========================================
// FILE SELECT
// ========================================

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", function () {

    if (!this.files || this.files.length === 0) {
        return;
    }

    const file = this.files[0];

    const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
    ];

    if (!allowedTypes.includes(file.type)) {

        alert("Please select a PDF, JPG or PNG file.");

        this.value = "";

        return;
    }


    // Maximum 25 MB

    if (file.size > 25 * 1024 * 1024) {

        alert("File size must be less than 25 MB.");

        this.value = "";

        return;
    }


    selectedFile = file;


    document.getElementById("fileName").textContent =
        file.name;

    document.getElementById("fileSize").textContent =
        formatFileSize(file.size);


    document.getElementById("selectedFile").style.display =
        "flex";

    document.getElementById("uploadBox").style.display =
        "none";

    document.getElementById("printButton").disabled =
        false;
});


// ========================================
// FILE SIZE
// ========================================

function formatFileSize(bytes) {

    if (bytes < 1024) {
        return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}


// ========================================
// REMOVE FILE
// ========================================

function removeFile() {

    selectedFile = null;

    fileInput.value = "";

    document.getElementById("selectedFile").style.display =
        "none";

    document.getElementById("uploadBox").style.display =
        "block";

    document.getElementById("printButton").disabled =
        true;
}


// ========================================
// COPIES
// ========================================

function changeCopies(change) {

    copies += change;

    if (copies < 1) {
        copies = 1;
    }

    if (copies > 100) {
        copies = 100;
    }

    document.getElementById("copies").textContent =
        copies;
}


// ========================================
// COLOR MODE
// ========================================

function selectColorMode(mode) {

    colorMode = mode;

    const bwButton =
        document.getElementById("bwButton");

    const colorButton =
        document.getElementById("colorButton");


    bwButton.classList.remove("active");

    colorButton.classList.remove("active");


    if (mode === "B&W") {

        bwButton.classList.add("active");

    } else {

        colorButton.classList.add("active");
    }
}


// ========================================
// SUBMIT JOB
// ========================================

async function submitJob() {

    if (!selectedFile) {

        alert("Please select a document first.");

        return;
    }


    const printButton =
        document.getElementById("printButton");


    // Prevent double-click uploads

    printButton.disabled = true;

    printButton.textContent = "Uploading...";


    try {

        const paperSize =
            document.getElementById("paperSize").value;


        const formData = new FormData();


        // IMPORTANT:
        // "file" must match multer.single("file")
        // in the Node.js server.

        formData.append(
            "file",
            selectedFile
        );


        formData.append(
            "copies",
            copies
        );


        formData.append(
            "color_mode",
            colorMode
        );


        formData.append(
            "paper_size",
            paperSize
        );


        const response = await fetch(
            `${API_URL}/api/jobs`,
            {
                method: "POST",
                body: formData
            }
        );


        const responseText = await response.text();

        console.log("HTTP status:", response.status);
        console.log("Server response:", responseText);

        let data;

        try {
            data = JSON.parse(responseText);
        } catch (error) {
            throw new Error(
                "Server returned non-JSON response:\n\n" +
                responseText.substring(0, 300)
            );
        }

        if (!response.ok) {
            throw new Error(
                data.error || "Upload failed."
            );
        }


        console.log("Server response:", data);


        // Server should return token

        const token =
            data.token;


        if (!token) {

            throw new Error(
                "Server did not return a Job ID."
            );
        }


        // Show real Job ID

        document.getElementById("jobToken")
            .textContent = token;


        // Show result page

        document.getElementById("uploadSection")
            .classList.add("hidden");

        document.getElementById("resultSection")
            .classList.remove("hidden");


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


    } catch (error) {

        console.error(error);

        alert(
            "Unable to send your document.\n\n" +
            error.message
        );


        printButton.disabled = false;

        printButton.textContent =
            "Upload & Send for Printing";
    }
}


// ========================================
// TRACK SECTION
// ========================================

function showTrackSection() {

    document.getElementById("uploadSection")
        .classList.add("hidden");

    document.getElementById("resultSection")
        .classList.add("hidden");

    document.getElementById("trackSection")
        .classList.remove("hidden");


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ========================================
// UPLOAD SECTION
// ========================================

function showUploadSection() {

    document.getElementById("trackSection")
        .classList.add("hidden");

    document.getElementById("resultSection")
        .classList.add("hidden");

    document.getElementById("uploadSection")
        .classList.remove("hidden");
}


// ========================================
// NEW ORDER
// ========================================

function newOrder() {

    selectedFile = null;

    copies = 1;

    colorMode = "B&W";

    fileInput.value = "";


    document.getElementById("copies")
        .textContent = "1";


    document.getElementById("bwButton")
        .classList.add("active");

    document.getElementById("colorButton")
        .classList.remove("active");


    document.getElementById("selectedFile")
        .style.display = "none";

    document.getElementById("uploadBox")
        .style.display = "block";


    const printButton =
        document.getElementById("printButton");

    printButton.disabled = true;

    printButton.textContent =
        "Upload & Send for Printing";


    showUploadSection();
}


// ========================================
// TRACK JOB
// ========================================

async function trackJob() {

    const input =
        document.getElementById("trackToken");


    const token =
        input.value
            .trim()
            .toUpperCase();


    if (!token) {

        alert("Please enter your Job ID.");

        return;
    }


    const result =
        document.getElementById("trackResult");


    result.classList.add("hidden");


    try {

        const response = await fetch(
            `${API_URL}/api/status/${encodeURIComponent(token)}`
        );


        const data = await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Job not found."
            );
        }


        document.getElementById("trackJobId")
            .textContent = token;


        const status =
            data.status;


        updateTrackStatus(status);


        result.classList.remove("hidden");


    } catch (error) {

        console.error(error);

        alert(
            "Unable to find this Job ID.\n\n" +
            error.message
        );
    }
}


// ========================================
// DISPLAY STATUS
// ========================================

function updateTrackStatus(status) {

    const statusTitle =
        document.getElementById("trackStatus");

    const statusMessage =
        document.getElementById("trackMessage");

    const statusCircle =
        document.getElementById("statusCircle");


    switch (status) {

        case "PENDING":

            statusTitle.textContent =
                "Waiting for approval";

            statusMessage.textContent =
                "Your document is being checked by the shop.";

            statusCircle.textContent =
                "…";

            break;


        case "PRINTING":

            statusTitle.textContent =
                "Printing";

            statusMessage.textContent =
                "Your document is currently being printed.";

            statusCircle.textContent =
                "🖨";

            break;


        case "COMPLETED":

            statusTitle.textContent =
                "Ready";

            statusMessage.textContent =
                "Your document has been printed. Please collect it from the shop.";

            statusCircle.textContent =
                "✓";

            break;


        case "REJECTED":

            statusTitle.textContent =
                "Order rejected";

            statusMessage.textContent =
                "The shop could not accept this document.";

            statusCircle.textContent =
                "×";

            break;


        case "FAILED":

            statusTitle.textContent =
                "Printing failed";

            statusMessage.textContent =
                "There was a problem while printing your document.";

            statusCircle.textContent =
                "!";

            break;


        default:

            statusTitle.textContent =
                status;

            statusMessage.textContent =
                "Please check again later.";

            statusCircle.textContent =
                "?";
    }
}

