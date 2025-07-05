# MJBalm Admin Setup Web Application

A comprehensive web application for setting up organizations, trainer accounts, and user management for the MJBalm horse management system.

## Overview

This Next.js application provides a user-friendly interface for administrators to:

- Create and configure organizations with complete setup
- Set up professional trainer organizations with specialized features
- Manage users and assign them to organizations with appropriate roles
- Streamline the onboarding process for new accounts

## Features

### 🏢 Organization Setup
- Create different organization types (Stable, Organization, Trainer, Enterprise)
- Automatically generate appropriate roles for each organization type
- Set up owner accounts with admin privileges
- Configure organization details, subscription tiers, and settings

### 🐎 Trainer Setup
- Specialized trainer organization creation
- Training specialization selection
- Professional trainer role hierarchy
- Client management capabilities
- Training-focused features and permissions

### 👥 User Management
- Create new user accounts
- Assign users to organizations
- Role-based access control
- Manage existing user assignments
- Bulk user operations

### 🔐 Security Features
- Admin authentication system
- Secure password-based access
- Environment-based configuration
- Supabase integration with Row Level Security

## Technology Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom ranch theme
- **Backend**: Supabase (PostgreSQL + Auth)
- **Forms**: React Hook Form with validation
- **UI Components**: Headless UI + Heroicons
- **Notifications**: React Hot Toast

## Installation & Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase project with admin access

### 1. Install Dependencies
```bash
cd admin-setup-web
npm install
```

### 2. Environment Configuration
Create a `.env.local` file based on `.env.example`:

```bash
cp env.example .env.local
```

Configure the following variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://hjqxajipxbbnggrscpcq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
ADMIN_PASSWORD=your_secure_admin_password
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Initial Access
1. Navigate to the application URL
2. You'll be redirected to the login page
3. Enter the admin password configured in your environment
4. Access the admin dashboard

### Organization Setup
1. Select "Organization Setup" from the dashboard
2. Fill in organization details:
   - Name, type, description
   - Contact information
   - Subscription tier
3. Create owner account:
   - Owner name and email
   - Secure password
4. Review default roles that will be created
5. Submit to create the complete organization

### Trainer Setup
1. Select "Trainer Setup" from the dashboard
2. Configure business information
3. Select training specializations
4. Create trainer account
5. Professional trainer organization created with:
   - Trainer-specific roles
   - Client management features
   - Training-focused permissions

### User Management
1. Select "User Management" from the dashboard
2. Choose between:
   - **Create New User**: Full user account creation
   - **Manage Existing**: Assign existing users to organizations
3. Select organization and appropriate role
4. User accounts created with proper access levels

## Organization Types & Default Roles

### Organization
- **Administrator**: Full management access
- **Manager**: Horse and task management
- **Staff**: Task execution and updates
- **Veterinarian**: Medical records access

### Trainer
- **Head Trainer**: Complete organization control
- **Trainer**: Horse and client management
- **Assistant Trainer**: Basic training tasks
- **Client**: Own horse access only

### Stable
- **Stable Owner**: Complete stable management
- **Stable Manager**: Operations management
- **Staff**: Daily operations
- **Boarder**: Own horse access

### Enterprise
- **Administrator**: System-wide management
- **Manager**: Department management
- **Staff**: Operational tasks
- **Veterinarian**: Medical oversight

## Database Schema Integration

The application integrates with the existing MJBalm database schema:

### Core Tables
- `organizations`: Organization records with settings
- `roles`: Role definitions with permissions
- `organization_members`: User-organization relationships
- `user_account_profiles`: Extended user profiles
- `tasks`: Task management (for trainer specialization)

### Key Features
- Automatic UUID generation for all records
- Proper foreign key relationships
- Role-based permissions system
- Subscription tier management
- Activity logging integration

## Security Considerations

### Authentication
- Simple password-based admin access
- Session-based authentication with cookies
- Environment-based password configuration

### Database Security
- Service role key for admin operations
- Row Level Security (RLS) policy compliance
- Proper permission checks for all operations

### Best Practices
- Passwords must be minimum 8 characters
- Email validation for all accounts
- Error handling with user-friendly messages
- Secure cookie configuration

## Customization

### Styling
The application uses a custom ranch theme with colors:
- `ranch-amber`: #FFB000
- `ranch-burnt-sienna`: #CD5C5C
- `ranch-olive`: #8B7355
- `ranch-sage`: #9CAF88
- `ranch-cream`: #F5F5DC

### Adding Organization Types
To add new organization types:
1. Update the `Organization` interface in `lib/supabase.ts`
2. Add default roles in `OrganizationSetup.tsx`
3. Update form options and validation

### Role Customization
Default roles can be modified in the setup components:
- `DEFAULT_ROLES` in `OrganizationSetup.tsx`
- `DEFAULT_TRAINER_ROLES` in `TrainerSetup.tsx`

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
Ensure all production environment variables are properly configured:
- Use production Supabase URLs and keys
- Set secure admin password
- Configure proper CORS settings

### Hosting Recommendations
- Vercel (seamless Next.js deployment)
- Netlify (with build settings)
- AWS Amplify
- Traditional VPS with PM2

## Troubleshooting

### Common Issues

**Login Issues**
- Verify admin password in environment
- Check cookie security settings
- Clear browser cookies and try again

**Database Connection**
- Verify Supabase URL and keys
- Check service role permissions
- Ensure RLS policies allow admin operations

**Role Creation Failures**
- Check for existing organization names
- Verify database schema is up to date
- Review Supabase logs for errors

### Support
For technical support or questions about the admin setup application, please refer to the main MJBalm project documentation or contact the development team.

## License

This application is part of the MJBalm horse management system. Please refer to the main project license for usage terms.

## Deployment to Netlify

### Option 1: Deploy from Git (Recommended)

1. Push your code to GitHub:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Go to [Netlify](https://netlify.com) and sign in

3. Click "New site from Git"

4. Choose GitHub and select your repository

5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`

6. Add environment variables in Netlify dashboard:
   - Go to Site settings > Environment variables
   - Add all variables from your `.env.local` file

7. Deploy the site

### Option 2: Manual Deploy

1. Build the project:
```bash
npm run build
```

2. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

3. Deploy:
```bash
netlify deploy --prod --dir=.next
```

### Environment Variables for Netlify

Make sure to add these environment variables in your Netlify site settings:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
ADMIN_PASSWORD=your_secure_admin_password
NEXT_PUBLIC_APP_URL=https://your-app-name.netlify.app
NODE_ENV=production
```

### Netlify Configuration

The project includes a `netlify.toml` file that handles:
- Build configuration
- API route redirects to Netlify Functions
- Security headers
- Development settings

## Troubleshooting

### Common Issues

1. **Supabase Connection**: Verify your environment variables are correct
2. **Authentication**: Ensure the admin password is set properly
3. **Database Permissions**: Confirm the service role key has necessary permissions
4. **Build Errors**: Check that all dependencies are installed correctly

### Netlify-Specific Issues

1. **API Routes Not Working**: Check that the `netlify.toml` redirects are configured correctly
2. **Environment Variables**: Ensure all variables are set in Netlify dashboard
3. **Build Failures**: Check the build logs in Netlify dashboard

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please contact the development team or create an issue in the repository.

## Environment Variables

### Required Environment Variables

For the application to work properly, you need to set the following environment variables:

#### Netlify Environment Variables
Set these in your Netlify dashboard under Site settings > Environment variables:

```bash
# Admin Authentication
ADMIN_PASSWORD=your_secure_admin_password_here

# Supabase Configuration (Client-side accessible)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Supabase Configuration (Server-side only)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

#### Important Notes:
- `NEXT_PUBLIC_*` variables are exposed to the browser and are required for client-side Supabase operations
- `SUPABASE_SERVICE_ROLE_KEY` is only used server-side for admin operations and should never be exposed to the client
- All variables must be set in Netlify for the deployed application to work

### Getting Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the following values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API keys > anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Project API keys > service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### Local Development

For local development, create a `.env.local` file in the project root:

```bash
ADMIN_PASSWORD=admin123
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Troubleshooting

### "supabaseKey is required" Error

This error occurs when the Supabase environment variables are not properly set. Check:

1. **Netlify Environment Variables**: Ensure all required variables are set in your Netlify dashboard
2. **Variable Names**: Make sure the variable names match exactly (case-sensitive)
3. **Build Logs**: Check Netlify build logs for any environment variable loading issues
4. **Browser Console**: Check for detailed error messages about which specific variable is missing

### Build Failures

If the build fails with environment variable errors:

1. Ensure all `NEXT_PUBLIC_*` variables are set
2. For API routes that need admin access, ensure `SUPABASE_SERVICE_ROLE_KEY` is set
3. Redeploy after setting all variables

### Client-Side vs Server-Side

- **Client-side code** (components, pages): Can only access `NEXT_PUBLIC_*` variables
- **Server-side code** (API routes): Can access all environment variables including `SUPABASE_SERVICE_ROLE_KEY`

## Components Overview

// ... existing content ... 