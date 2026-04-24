# GitHub Setup & CI/CD Configuration Guide

## 📝 Step 1: Repository Setup

### Create the GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository: **campusquest-go**
3. Choose **Public** (for university submission) or **Private** (for team only)
4. Do NOT initialize with README (we have one)
5. Click "Create repository"

### Clone Boilerplate to Your Repo

```bash
# Clone the boilerplate
git clone https://github.com/your-team/campusquest-go.git
cd campusquest-go

# Copy all boilerplate files (from /home/claude/)
# This includes:
# - docker-compose.yml
# - init.sql
# - README.md
# - services/ (all 4)
# - frontend/
# - integration-tests/
# - ansible/
# - .github/workflows/ci-cd.yml

# Add all files
git add .

# Commit
git commit -m "Initial CampusQuest Go microservices boilerplate

- 4 independent microservices (Fitness, Merchant, Geo, Rewards)
- PostgreSQL database with initialization script
- Docker Compose orchestration
- GitHub Actions CI/CD pipeline
- Ansible Infrastructure as Code
- React frontend dashboard
- Comprehensive testing (unit + integration)
- Complete documentation"

# Push to GitHub
git push origin main
```

---

## 🔐 Step 2: Configure GitHub Secrets

The CI/CD pipeline needs secrets. Add them to your repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

### Required Secrets

```
GITHUB_TOKEN          # Auto-created by GitHub (use default)
SNYK_TOKEN           # Get from https://snyk.io (free for open source)
SLACK_WEBHOOK_URL    # (Optional) For Slack notifications
DEPLOY_KEY           # (Phase 2) SSH key for deployment server
STAGING_SERVER       # (Phase 2) IP of staging server
```

### How to Get Each Secret

#### SNYK_TOKEN
```bash
# 1. Sign up at https://snyk.io
# 2. Go to Account Settings → API Token
# 3. Copy the token
# 4. Add to GitHub Secrets as SNYK_TOKEN
```

#### SLACK_WEBHOOK_URL (Optional)
```bash
# 1. Create Slack App at https://api.slack.com/apps
# 2. Enable Incoming Webhooks
# 3. Create new webhook for #deployments channel
# 4. Copy the webhook URL
# 5. Add to GitHub Secrets
```

---

## 🏗️ Step 3: Configure Repository Branches

### Branch Protection Rules

1. Go to **Settings** → **Branches**
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging

### Status Checks Required
- test-services
- security-scan
- build-docker
- integration-test

---

## 👥 Step 4: Team Member Setup

### For Each Team Member

```bash
# Clone the repository
git clone https://github.com/your-team/campusquest-go.git
cd campusquest-go

# Create personal branch
git checkout -b feature/member-a-fitness

# Make changes to their service
cd services/fitness-sync-service/
# ... edit files ...

# Commit changes
git add .
git commit -m "feat(fitness): implement Strava integration and point calculation

- Added /api/fitness/sync endpoint
- Implemented 1 mile = 10 points conversion
- Added Jest unit tests
- Database transaction safety"

# Push branch
git push origin feature/member-a-fitness

# Create Pull Request on GitHub
```

---

## 🔄 Step 5: Pull Request & Code Review Process

### Creating a Pull Request

1. Push your branch to GitHub
2. GitHub shows "Compare & pull request" button
3. Fill in:
   - **Title**: Clear description of changes
   - **Description**: What was implemented, why, and how to test
   - **Link issues**: Reference any GitHub issues

### Pull Request Template

Create `.github/pull_request_template.md`:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] New feature (non-breaking change)
- [ ] Bug fix (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## Changes Made
- Change 1
- Change 2

## Testing Done
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Tested locally with Docker Compose

## Screenshots (if applicable)
<!-- Add screenshots here -->

## Checklist
- [ ] My code follows the project style
- [ ] I have performed self-review
- [ ] I have commented complex logic
- [ ] Tests are updated
- [ ] No hardcoded secrets in code
```

### Code Review Checklist

Before approving a PR, reviewers should check:

- ✅ Code quality and readability
- ✅ Tests included and passing
- ✅ No hardcoded secrets or credentials
- ✅ Documentation updated
- ✅ CI/CD pipeline passes
- ✅ No merge conflicts

---

## 🚀 Step 6: GitHub Actions Workflow

### Monitor Pipeline

1. Go to **Actions** tab in your repository
2. Click on a workflow run to see details
3. Click on a job to see logs

### Pipeline Stages (In Order)

```
1. test-services (runs tests)
   ↓
2. security-scan (Snyk + secret detection)
   ↓
3. build-docker (only if main branch)
   ↓
4. integration-test (E2E tests)
   ↓
5. deploy-staging (only if main branch)
   ↓
6. notify (Slack notification)
```

### Fix Failed Pipeline

1. Check the failed job logs
2. Fix the issue locally
3. Push a new commit
4. Pipeline re-runs automatically

**Common failures**:
- ❌ Tests failing → Fix test, commit, push
- ❌ Security issues → Update dependencies, run `npm audit fix`
- ❌ Docker build failing → Check Dockerfile, run `docker build` locally first

---

## 📊 Step 7: GitHub Project Board (Optional)

### Set Up Project for Team Organization

1. Go to **Projects** tab
2. Click "New project"
3. Choose "Table" view
4. Add columns:
   - 📋 **Backlog** (features to implement)
   - 🔄 **In Progress** (currently working on)
   - 👀 **Review** (PR submitted)
   - ✅ **Done** (merged to main)

### Link Issues to PRs

When creating a PR, link to an issue:
```
Closes #123
```

This automatically closes the issue when PR is merged.

---

## 📈 Step 8: Team Collaboration Best Practices

### Git Workflow

```
main (production) ← develop ← feature branches
```

#### For each feature:

```bash
# 1. Create feature branch
git checkout -b feature/member-name-feature

# 2. Make changes
git add .
git commit -m "type(scope): description"

# 3. Push to GitHub
git push origin feature/member-name-feature

# 4. Create Pull Request on GitHub
# → Get code review
# → Fix any issues
# → Merge to main

# 5. Delete branch
git branch -d feature/member-name-feature
```

### Commit Message Convention

```
feat(service): add new feature
fix(service): fix a bug
docs(service): update documentation
test(service): add tests
chore(service): maintenance tasks
```

**Example**:
```
feat(fitness): implement Strava API integration

- Added POST /api/fitness/sync endpoint
- Implemented distance to points conversion (1 mile = 10 pts)
- Added comprehensive unit tests
- Ensures database transaction safety
```

---

## 🔍 Step 9: Monitoring & Notifications

### GitHub Status Checks

All services must pass checks before merge:

```yaml
✅ test-services      # All unit tests pass
✅ security-scan      # No vulnerabilities
✅ build-docker       # Docker images build
✅ integration-test   # E2E tests pass
```

### Setting Up Slack Notifications (Optional)

1. Connect your Slack workspace to GitHub
2. Subscribe to deployment notifications
3. Get real-time alerts on pipeline status

### View Repository Insights

- **Pulse**: Overview of recent activity
- **Insights → Traffic**: Commit history
- **Insights → Network**: Branch timeline
- **Insights → Code frequency**: Development activity

---

## 📋 Step 10: Pre-Deployment Checklist

Before Phase 2 (Week 11), ensure:

- ✅ All 4 services have meaningful commits
- ✅ Each team member has contributed code
- ✅ GitHub Actions pipeline is passing
- ✅ Docker Compose runs locally
- ✅ Integration tests pass
- ✅ README is complete
- ✅ No hardcoded secrets in repository
- ✅ All tests have reasonable coverage

---

## 🎯 GitHub Setup Timeline

| Week | Task |
|------|------|
| **1-2** | Create repo, add boilerplate, setup secrets |
| **2-3** | Team members create branches, start features |
| **3-5** | Regular commits, code reviews, tests |
| **5-8** | Continue development, fix bugs |
| **8-9** | Final testing, documentation |
| **9-10** | Prepare for Midpoint Assessment |
| **10-13** | Phase 2 DevOps enhancements |

---

## ⚠️ Common GitHub Issues

### Issue: PR says "merge conflict"
**Solution**:
```bash
git fetch origin
git rebase origin/main
# Fix conflicts in editor
git add .
git rebase --continue
git push -f origin feature/your-branch
```

### Issue: Pipeline won't run
**Solution**:
1. Check `.github/workflows/ci-cd.yml` exists
2. Commit to `main` branch (not develop)
3. Check GitHub Actions is enabled: Settings → Actions

### Issue: Docker build failing in pipeline
**Solution**:
```bash
# Test locally first
docker build services/fitness-sync-service/
# If it fails, fix the Dockerfile
# Then push again
```

### Issue: Tests pass locally but fail in CI
**Solution**:
1. Check for hardcoded URLs (localhost won't work in CI)
2. Ensure all dependencies in package.json
3. Check Node version in workflow (18 expected)

---

## 📚 Additional Resources

- [GitHub Docs](https://docs.github.com)
- [GitHub Actions Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

---

## 🚀 You're Ready!

Your GitHub repository is now configured for:
- ✅ Team collaboration
- ✅ Automated testing
- ✅ Continuous integration
- ✅ Security scanning
- ✅ Automated deployment

**Next**: Start coding! 💻

---

**Last Updated**: April 24, 2026
**Version**: 1.0.0
