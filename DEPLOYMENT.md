# Netlify Deployment Guide

This guide will help you deploy the MJBalm Admin Setup Web Application to Netlify.

## Prerequisites

- GitHub account with your repository: https://github.com/Grayjack64/BarnBoss-admin.git
- Netlify account (free tier is sufficient)
- Supabase project with service role key
- Node.js 18+ (for local development)

## Step 1: GitHub Repository Setup

1. **Clone your repository locally:**
   ```bash
   git clone https://github.com/Grayjack64/BarnBoss-admin.git
   cd BarnBoss-admin
   ```

2. **Add all your files and push:**
   ```bash
   git add .
   git commit -m "Initial commit - MJBalm Admin Setup Web App"
   git push origin main
   ```

## Step 2: Netlify Account Setup

1. **Sign up for Netlify:**
   - Go to [https://netlify.com](https://netlify.com)
   - Sign up using your GitHub account (recommended)

2. **Connect your repository:**
   - Click "New site from Git"
   - Choose GitHub as your provider
   - Select your repository: `Grayjack64/BarnBoss-admin`
   - Authorize Netlify to access your GitHub account

## Step 3: Configure Build Settings

1. **Build Settings:**
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Base directory:** (leave empty)

2. **Advanced Settings:**
   - Click "Advanced build settings"
   - Set Node.js version: `18` (or higher)

## Step 4: Environment Variables

Add these environment variables in your Netlify dashboard:

1. **Go to Site Settings > Environment Variables**
2. **Add the following variables:**

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ADMIN_PASSWORD=your_secure_admin_password
   NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
   NODE_ENV=production
   ```

   **Where to find your Supabase values:**
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy the Project URL and anon key
   - For service role key, scroll down to "Service Role" section

## Step 5: Deploy

1. **Automatic Deployment:**
   - Once you've configured everything, click "Deploy Site"
   - Netlify will automatically build and deploy your application
   - This process takes 2-5 minutes

2. **Manual Deployment (alternative):**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Deploy
   netlify deploy --prod --dir=.next
   ```

## Step 6: Custom Domain (Optional)

1. **Set up custom domain:**
   - In Netlify dashboard, go to Site Settings > Domain Management
   - Click "Add custom domain"
   - Follow the DNS configuration instructions

2. **Enable HTTPS:**
   - Netlify automatically provides SSL certificates
   - Enable "Force HTTPS redirect" for security

## Step 7: Test Your Deployment

1. **Visit your site:**
   - Use the Netlify URL provided (e.g., `https://wonderful-app-123456.netlify.app`)
   - Or your custom domain if configured

2. **Test admin login:**
   - Go to `/login`
   - Use your admin password
   - Verify you can access the dashboard

3. **Test functionality:**
   - Try creating an organization
   - Test user management features
   - Verify all forms work correctly

## Troubleshooting

### Common Issues

1. **Build Failures:**
   - Check build logs in Netlify dashboard
   - Verify all environment variables are set
   - Ensure Node.js version is 18+

2. **API Routes Not Working:**
   - Verify `netlify.toml` is in your repository root
   - Check that redirects are configured correctly
   - Environment variables must be set in Netlify dashboard, not `.env` files

3. **Supabase Connection Issues:**
   - Verify your Supabase URL and keys are correct
   - Check that your service role key has the necessary permissions
   - Ensure your Supabase project is not paused

4. **Authentication Problems:**
   - Verify `ADMIN_PASSWORD` is set correctly
   - Check that `NEXT_PUBLIC_APP_URL` matches your actual domain

### Build Logs

To view build logs:
1. Go to your Netlify site dashboard
2. Click on "Deploys"
3. Click on a specific deploy to see detailed logs

### Environment Variables

To update environment variables:
1. Go to Site Settings > Environment Variables
2. Edit existing variables or add new ones
3. Trigger a new deploy for changes to take effect

## Continuous Deployment

Once set up, your site will automatically redeploy whenever you push changes to your GitHub repository:

1. **Make changes locally**
2. **Commit and push:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. **Netlify automatically rebuilds and deploys**

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files to your repository
   - Use Netlify's environment variable management
   - Only `NEXT_PUBLIC_*` variables are exposed to the browser

2. **Admin Password:**
   - Use a strong, unique password
   - Consider implementing more robust authentication for production

3. **HTTPS:**
   - Always use HTTPS in production
   - Netlify provides this automatically

## Performance Optimization

1. **Caching:**
   - Netlify automatically caches static assets
   - API responses are cached appropriately

2. **CDN:**
   - Your site is automatically distributed via Netlify's global CDN
   - No additional configuration needed

## Support

For deployment issues:
1. Check Netlify documentation: https://docs.netlify.com
2. Review build logs in your Netlify dashboard
3. Test locally first: `npm run build` and `npm run start`
4. Contact the development team if issues persist

## Useful Commands

```bash
# Test build locally
npm run build

# Start production server locally
npm run start

# Deploy using Netlify CLI
netlify deploy --prod --dir=.next

# View site logs
netlify logs

# Open site in browser
netlify open:site
```

---

**Note:** This guide assumes you're using the provided configuration files (`netlify.toml`, `next.config.js`, etc.). If you modify these files, you may need to adjust the deployment settings accordingly. 