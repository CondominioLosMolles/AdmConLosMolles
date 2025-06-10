const CLIENT_ID = '997872453031-5o8s2o6v3qt722fb3p51a2r7bo24ncee.apps.googleusercontent.com';
const API_KEY = 'AIzaSyA4nUkMycf_CHZE7TaBBD_WUyWMvSXUwoU';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.send';

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPES,
    discoveryDocs: [
      "https://sheets.googleapis.com/$discovery/rest?version=v4",
      "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
      "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"
    ]
  }).then(() => {
    const isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
    updateSigninStatus(isSignedIn);
    document.getElementById("loginBtn").onclick = handleSignIn;
    document.getElementById("logoutBtn").onclick = handleSignOut;
  });
}

function handleSignIn() {
  gapi.auth2.getAuthInstance().signIn();
}

function handleSignOut() {
  gapi.auth2.getAuthInstance().signOut();
}

function updateSigninStatus(isSignedIn) {
  const app = document.getElementById("app");
  const login = document.getElementById("login-container");
  if (isSignedIn) {
    app.classList.remove("hidden");
    login.classList.add("hidden");
    loadMainView();
  } else {
    app.classList.add("hidden");
    login.classList.remove("hidden");
  }
}

function loadMainView() {
  showView("dashboard");
}

function showView(id) {
  document.querySelectorAll(".view").forEach(el => el.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

gapi.load('client:auth2', initClient);
