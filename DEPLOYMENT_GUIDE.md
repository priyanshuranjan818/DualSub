# 🚀 Complete Deployment Guide — LearnWithMe on AWS
### For Absolute Beginners — Step by Step, Nothing Skipped

---

## 📋 What You Will Build

```
Your PC (Code)
    ↓  git push
GitHub
    ↓  GitHub Actions triggers
Docker Hub (stores your Docker image)
    ↓  pulls image
AWS EC2 (your server in the cloud)
    └── K3s (Kubernetes)
        ├── LearnWithMe App Pod
        └── Grafana + Prometheus (monitoring)
```

---

## 🛒 PHASE 0 — Prerequisites (Install These First)

You need these tools on your **Windows PC** before anything.

### 0.1 Install AWS CLI
1. Go to: https://aws.amazon.com/cli/
2. Click **"Install AWS CLI"** → download the `.msi` for Windows
3. Run the installer
4. Open PowerShell and verify:
   ```powershell
   aws --version
   # Should print: aws-cli/2.x.x ...
   ```

### 0.2 Install Terraform
1. Go to: https://developer.hashicorp.com/terraform/install
2. Download the **Windows AMD64** zip
3. Extract `terraform.exe`
4. Move `terraform.exe` to `C:\Windows\System32\` (so it works everywhere)
5. Verify:
   ```powershell
   terraform -version
   # Should print: Terraform v1.x.x
   ```

### 0.3 Install kubectl
1. Download from: https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
2. Or run in PowerShell (as Admin):
   ```powershell
   choco install kubernetes-cli
   ```
3. Verify:
   ```powershell
   kubectl version --client
   ```

### 0.4 Create a Docker Hub Account
1. Go to: https://hub.docker.com/
2. Sign up for a free account
3. Remember your **username** — you'll need it

---

## ☁️ PHASE 1 — Set Up Your AWS Account

### 1.1 Create AWS Account
1. Go to: https://aws.amazon.com/
2. Click **"Create an AWS Account"**
3. Enter your email, create a password
4. Choose **"Personal"** account type
5. Enter credit card (you won't be charged for free tier usage)
6. Verify your phone number
7. Select **"Basic support – Free"**

> ⚠️ **Important:** The t3.medium EC2 instance we use costs ~$0.04/hour (~$30/month). **Stop the instance when not using it** to save money.

### 1.2 Create an IAM User (Don't use root account!)
Root account is like the master key — never use it directly.

1. Log in to: https://console.aws.amazon.com/
2. Search for **"IAM"** in the top search bar → click it
3. Click **"Users"** on the left sidebar
4. Click **"Create user"** (top right)
5. Username: `devops-user` → click Next
6. Select **"Attach policies directly"**
7. Search and check these policies:
   - ✅ `AmazonEC2FullAccess`
   - ✅ `AmazonVPCFullAccess`
   - ✅ `IAMReadOnlyAccess`
8. Click **Next** → **Create user**

### 1.3 Create Access Keys for IAM User
1. Click on `devops-user` you just created
2. Click **"Security credentials"** tab
3. Scroll down to **"Access keys"** → click **"Create access key"**
4. Select **"Command Line Interface (CLI)"** → check the confirmation box
5. Click **Next** → **Create access key**
6. ⚠️ **IMPORTANT:** Click **"Download .csv file"** — you can NEVER see the secret key again!
7. Open the CSV file — it has:
   - `Access key ID` (like: `AKIAIOSFODNN7EXAMPLE`)
   - `Secret access key` (like: `wJalrXUtnFEMI/K7...`)

### 1.4 Configure AWS CLI on Your PC
Open PowerShell and run:
```powershell
aws configure
```
It will ask 4 questions:
```
AWS Access Key ID: <paste your Access key ID>
AWS Secret Access Key: <paste your Secret access key>
Default region name: us-east-1
Default output format: json
```

Verify it works:
```powershell
aws sts get-caller-identity
# Should print your account ID and username
```

---

## 🔑 PHASE 2 — Create SSH Key Pair on AWS

You need this to SSH into your server.

### 2.1 Create the Key Pair
```powershell
aws ec2 create-key-pair `
  --key-name learnwithme-key `
  --query "KeyMaterial" `
  --output text `
  --region us-east-1 > $HOME\.ssh\learnwithme-key.pem
```

Verify the file was created:
```powershell
ls $HOME\.ssh\learnwithme-key.pem
```

> ⚠️ This `.pem` file is your private key. Never share it or commit it to GitHub.

---

## 🏗️ PHASE 3 — Deploy AWS Infrastructure with Terraform

### 3.1 Navigate to the Terraform folder
```powershell
cd C:\Users\priya\Desktop\DualSub\terraform
```

### 3.2 Initialize Terraform
This downloads the AWS provider plugin:
```powershell
terraform init
```
You should see: `Terraform has been successfully initialized!`

### 3.3 Preview What Will Be Created
```powershell
terraform plan
```
Read through the output. It shows every AWS resource that will be created:
- 1 Security Group
- 1 EC2 instance (t3.medium, Ubuntu 22.04)

### 3.4 Apply — Create the Infrastructure!
```powershell
terraform apply
```
It will ask: `Do you want to perform these actions?`
Type: `yes` → press Enter

⏳ Wait 2-3 minutes. When done you'll see:
```
Apply complete! Resources: 3 added.
Outputs:
  k3s_node_public_ip = "54.123.45.678"    ← YOUR SERVER IP
```

**📌 Write down your public IP!** You'll need it everywhere.

### 3.5 Wait for K3s to Install
The server is now running but it takes ~5 minutes to:
- Install Docker
- Install K3s (Kubernetes)
- Install Helm

Go get a coffee ☕ then continue.

---

## 🔌 PHASE 4 — Connect to Your Server

### 4.1 SSH Into the Server
Replace `54.123.45.678` with YOUR actual IP from Step 3.4:
```powershell
ssh -i $HOME\.ssh\learnwithme-key.pem ubuntu@54.123.45.678
```

If asked `Are you sure you want to continue connecting?` → type `yes`

You should now see something like:
```
ubuntu@ip-172-31-12-34:~$
```
You are now **inside your AWS server**! 🎉

### 4.2 Verify K3s is Running
```bash
kubectl get nodes
```
Expected output:
```
NAME                STATUS   ROLES                  AGE
ip-172-31-12-34    Ready    control-plane,master   5m
```
If STATUS is `Ready` → ✅ Kubernetes is running!

If not ready yet, wait 2 more minutes and try again.

### 4.3 Copy the K3s Config to Your Local PC
This lets you run `kubectl` commands from your **Windows PC** instead of always SSH-ing in.

On the server, display the config:
```bash
cat /home/ubuntu/.kube/config
```
Copy ALL the output (select all text, Ctrl+C).

On your Windows PC (open a new PowerShell):
```powershell
# Create kubectl config directory
mkdir -Force $HOME\.kube

# Create the file (paste your copied content)
notepad $HOME\.kube\config
```
Paste everything and save.

Now replace `127.0.0.1` with your EC2 IP address in that file:
- Open `C:\Users\priya\.kube\config` in Notepad
- Find: `server: https://127.0.0.1:6443`
- Replace with: `server: https://54.123.45.678:6443`
- Save the file

Test from your PC:
```powershell
kubectl get nodes
# Should show your node as Ready
```

---

## 🐳 PHASE 5 — Build and Push Docker Image

### 5.1 Log In to Docker Hub
```powershell
docker login
# Enter your Docker Hub username and password
```

### 5.2 Build the Docker Image
From your project root:
```powershell
cd C:\Users\priya\Desktop\DualSub
docker build -t yourusername/learnwithme-app:latest .
```
Replace `yourusername` with your actual Docker Hub username.

This takes ~5-10 minutes the first time (downloads base images).

### 5.3 Push to Docker Hub
```powershell
docker push yourusername/learnwithme-app:latest
```

Verify at: https://hub.docker.com/r/yourusername/learnwithme-app

---

## ☸️ PHASE 6 — Deploy App to Kubernetes

### 6.1 Update the Image Name
Open `k8s/app-deployment.yaml` and replace `yourusername` with your Docker Hub username:
```yaml
image: yourusername/learnwithme-app:latest
#               ↑ change this
```

### 6.2 Create the Kubernetes Secret for API Keys
```powershell
kubectl create secret generic learnwithme-secrets `
  --from-literal=GROQ_API_KEY=your-groq-key-here `
  --from-literal=DEEPL_KEY=your-deepl-key-here
```
Replace with your actual keys (or skip DEEPL_KEY if you don't have one).

To get a free Groq API key: https://console.groq.com/

### 6.3 Apply All Kubernetes Files
```powershell
cd C:\Users\priya\Desktop\DualSub
kubectl apply -f k8s/app-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### 6.4 Watch the Deployment
```powershell
kubectl get pods --watch
```
Wait until you see:
```
NAME                                READY   STATUS    RESTARTS
learnwithme-app-7d8f9c-xxxx         1/1     Running   0
```
Press `Ctrl+C` to stop watching.

### 6.5 Access Your App! 🎉
Open your browser and go to:
```
http://54.123.45.678
```
Replace with YOUR EC2 IP. Your app should be live!

---

## 📊 PHASE 7 — Set Up Monitoring (Grafana + Prometheus)

### 7.1 SSH Into the Server
```powershell
ssh -i $HOME\.ssh\learnwithme-key.pem ubuntu@54.123.45.678
```

### 7.2 Run the Monitoring Install Script
```bash
chmod +x ~/k8s-manifests/monitoring/install-monitoring.sh
# Or copy-paste the commands manually:

helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm upgrade --install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.service.type=LoadBalancer
```

### 7.3 Wait for Monitoring to Start
```bash
kubectl get pods -n monitoring --watch
```
Wait until all pods show `Running`. Takes 3-5 minutes.

### 7.4 Get the Grafana URL
```bash
kubectl get svc -n monitoring
```
Look for `prometheus-stack-grafana` — note the `EXTERNAL-IP` or use port-forward:
```bash
kubectl port-forward svc/prometheus-stack-grafana 3000:80 -n monitoring
```
Then open on your PC: http://localhost:3000

**Default Grafana login:**
- Username: `admin`
- Password: `prom-operator`

### 7.5 Explore Dashboards
1. Click **"Dashboards"** on the left
2. Open **"Kubernetes / Compute Resources / Pod"**
3. You'll see live CPU and memory graphs of your app! 📈

---

## ⚙️ PHASE 8 — Set Up GitHub Actions (Auto-Deploy on Push)

Every time you push code to `main`, this automatically rebuilds and redeploys.

### 8.1 Add Secrets to GitHub
1. Go to your GitHub repo
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add each one:

| Secret Name | Value |
|------------|-------|
| `DOCKER_USERNAME` | Your Docker Hub username |
| `DOCKER_PASSWORD` | Your Docker Hub password |
| `EC2_HOST` | Your EC2 IP (e.g. `54.123.45.678`) |
| `SSH_PRIVATE_KEY` | Contents of `learnwithme-key.pem` file |

To get the SSH key content:
```powershell
cat $HOME\.ssh\learnwithme-key.pem
# Copy ALL the output including -----BEGIN RSA PRIVATE KEY-----
```

### 8.2 Test the Pipeline
```powershell
cd C:\Users\priya\Desktop\DualSub
git add .
git commit -m "feat: add devops pipeline"
git push origin main
```

Then go to GitHub → **Actions** tab → watch the pipeline run live!

If everything turns green ✅ → your CI/CD is working!

---

## 💡 PHASE 9 — Day-to-Day Commands (Cheatsheet)

### Save Money — Stop the Server When Not Using It
```powershell
# Stop EC2 (pauses billing for compute, storage still billed ~$0.80/month)
aws ec2 stop-instances --instance-ids <your-instance-id> --region us-east-1

# Start it back up
aws ec2 start-instances --instance-ids <your-instance-id> --region us-east-1

# Get your instance ID
aws ec2 describe-instances --region us-east-1 --query "Reservations[].Instances[].InstanceId"
```

### Check App Status
```powershell
kubectl get pods
kubectl get svc
kubectl logs deployment/learnwithme-app --tail=50
```

### Redeploy After Code Change
```powershell
docker build -t yourusername/learnwithme-app:latest .
docker push yourusername/learnwithme-app:latest
kubectl rollout restart deployment learnwithme-app
kubectl rollout status deployment learnwithme-app
```

### Destroy Everything (Stop AWS Charges)
```powershell
cd C:\Users\priya\Desktop\DualSub\terraform
terraform destroy
# Type: yes
```
This deletes ALL AWS resources and stops all billing.

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `kubectl get nodes` shows NotReady | Wait 5 more mins, K3s is still starting |
| Pod stuck in `Pending` | Run `kubectl describe pod <pod-name>` and read Events section |
| Pod stuck in `ImagePullBackOff` | Wrong image name — check `yourusername` is correct in deployment.yaml |
| Can't SSH into server | Check Security Group allows port 22, check IP hasn't changed |
| App not loading in browser | Run `kubectl get pods` — are they Running? Check `kubectl logs` |
| Terraform apply fails | Run `aws sts get-caller-identity` — are credentials valid? |

---

## ✅ Final Checklist

- [ ] AWS CLI configured
- [ ] Terraform installed
- [ ] SSH key created
- [ ] `terraform apply` succeeded
- [ ] K3s shows node as `Ready`
- [ ] Docker image pushed to Docker Hub
- [ ] Kubernetes secret created
- [ ] App pods are `Running`
- [ ] App loads at http://YOUR-IP
- [ ] Grafana dashboard visible
- [ ] GitHub Actions pipeline passes

**Congratulations! You just deployed a production-grade app on AWS with Kubernetes. 🎉**
