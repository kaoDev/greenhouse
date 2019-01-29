workflow "build and deploy" {
  on = "push"
  resolves = [
    "install functions deps",
    "test frontend",
    "GitHub Action for Firebase",
  ]
}

action "install react app deps" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  args = "install"
}

action "install functions deps" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  runs = "cd functions && npm install"
}

action "test frontend" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  needs = ["install react app deps"]
  args = "test"
}

action "build frontend" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  needs = ["test frontend"]
  args = "build"
}

action "GitHub Action for Firebase" {
  uses = "w9jds/firebase-action@7d6b2b058813e1224cdd4db255b2f163ae4084d3"
  needs = ["build frontend", "install functions deps"]
  args = "deploy"
}
