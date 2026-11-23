
export const checkEnvironment = () => {
  const envVars = [
    'NODE_ENV'
  ];

  const missingVars = envVars.filter(varName => !process.env[varName]);

  const envInfo = {
    nodeEnv: process.env.NODE_ENV || 'development',
    supabaseUrl: '✅ Using Mock Data (No Supabase)',
    supabaseKey: '✅ Using Mock Data (No Supabase)',
    missingVars
  };

  return envInfo;
};

export const isEnvironmentValid = () => {
  const envInfo = checkEnvironment();
  return envInfo.missingVars.length === 0;
}; 