workflow "build and deploy" {
  on = "push"
  resolves = [
    "test frontend",
    "GitHub Action for Firebase",
  ]
}

action "install react app deps" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  args = "install"
}

action "test frontend" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  needs = ["install react app deps"]
  args = "test"
  env = {
    CI = "true"
  }
}

action "build frontend" {
  uses = "actions/npm@3c8332795d5443adc712d30fa147db61fd520b5a"
  needs = ["test frontend"]
  args = "build"
}

action "GitHub Action for Firebase" {
  uses = "w9jds/firebase-action@7d6b2b058813e1224cdd4db255b2f163ae4084d3"
  needs = ["build frontend"]
  args = "deploy"
}
