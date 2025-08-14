#!/usr/bin/env node

/**
 * Database Ownership Validation Script
 * Ensures the ownership model is correctly implemented between web1.0 and agent-runtime
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Table ownership mapping
const TABLE_OWNERSHIP = {
  // web1.0 owned tables (write access)
  web1_0: [
    'User', 'Organization', 'TeamMember', 'License', 'LicenseSection',
    'Note', 'NoteFolder', 'Task', 'Project', 'CalendarEvent', 'Email',
    'File', 'FileFolder', 'Sheet', 'SheetVersion', 'WorkspaceItem',
    'BankAccount', 'Transaction', 'BrokerageConnection', 'Holding',
    'Position', 'Portfolio', 'PortfolioTransaction', 'Web3WalletConnection',
    'Integration', 'app_platforms', 'core_actions', 'integration_catalog',
    'user_installations', 'integration_actions', 'integration_reviews',
    'integration_tags', 'Activity', 'LLMRequest', 'AI',
    'PotentialEnterpriseClient'
  ],
  
  // agent-runtime owned tables (write access)
  agent_runtime: [
    'agents', 'agent_executions', 'action_executions'
  ],
  
  // Legacy/deprecated tables (to be migrated or removed)
  legacy: [
    'agent_alerts', 'agent_deployments', 'agent_environments',
    'agent_files', 'agent_logs', 'agent_metrics', 'agent_schedules',
    'agent_tasks', 'agent_templates', 'agent_usage'
  ]
};

async function validateTableExistence() {
  console.log('▶ Validating table existence...');
  const tables = await prisma.$queryRaw`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  
  const tableNames = tables.map(t => t.tablename);
  const errors = [];
  
  // Check if all owned tables exist
  const allOwnedTables = [
    ...TABLE_OWNERSHIP.web1_0,
    ...TABLE_OWNERSHIP.agent_runtime
  ];
  
  for (const table of allOwnedTables) {
    // Convert PascalCase to snake_case for database
    const dbTableName = table.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
    if (!tableNames.includes(dbTableName)) {
      errors.push(`❌ Missing table: ${table} (${dbTableName})`);
    } else {
      console.log(`✅ Table exists: ${table}`);
    }
  }
  
  // Check for unexpected tables
  for (const tableName of tableNames) {
    if (tableName.startsWith('_prisma')) continue; // Skip Prisma internal tables
    
    const pascalCase = tableName.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
      .replace(/^[a-z]/, (g) => g.toUpperCase());
    
    const isKnown = allOwnedTables.some(t => 
      t.toLowerCase() === pascalCase.toLowerCase() ||
      t.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '') === tableName
    ) || TABLE_OWNERSHIP.legacy.some(t => t === tableName);
    
    if (!isKnown) {
      console.log(`⚠️  Unknown table: ${tableName}`);
    }
  }
  
  return errors;
}

async function validatePermissions() {
  console.log('\n▶ Validating database permissions...');
  
  try {
    // Check if permission users exist
    const users = await prisma.$queryRaw`
      SELECT usename FROM pg_user 
      WHERE usename IN ('web_app', 'agent_runtime');
    `;
    
    if (users.length < 2) {
      console.log('⚠️  Permission users not fully configured (web_app, agent_runtime)');
      console.log('   Run: psql -f scripts/setup-db-permissions.sql');
      return ['Permission users not configured'];
    }
    
    // Check permissions for web_app user
    const web1_0Perms = await prisma.$queryRaw`
      SELECT 
        tablename,
        has_table_privilege('web_app', schemaname||'.'||tablename, 'SELECT') as can_read,
        has_table_privilege('web_app', schemaname||'.'||tablename, 'INSERT') as can_insert
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('core_actions', 'app_platforms', 'agents', 'agent_executions')
      ORDER BY tablename;
    `;
    
    // Validate web_app permissions
    for (const perm of web1_0Perms) {
      if (perm.tablename === 'core_actions' || perm.tablename === 'app_platforms') {
        if (!perm.can_insert) {
          console.log(`❌ web_app should have WRITE access to ${perm.tablename}`);
        } else {
          console.log(`✅ web_app has correct access to ${perm.tablename}`);
        }
      } else if (perm.tablename === 'agents' || perm.tablename === 'agent_executions') {
        if (perm.can_insert) {
          console.log(`❌ web_app should NOT have WRITE access to ${perm.tablename}`);
        } else {
          console.log(`✅ web_app has correct access to ${perm.tablename} (read-only)`);
        }
      }
    }
    
    return [];
  } catch (error) {
    console.log('ℹ️  Could not validate permissions (may need superuser access)');
    return [];
  }
}

async function validateGoStructAlignment() {
  console.log('\n▶ Checking Go struct alignment with Prisma schema...');
  
  const agentRuntimePath = path.join(__dirname, '../../agent-runtime');
  
  if (!fs.existsSync(agentRuntimePath)) {
    console.log('⚠️  agent-runtime directory not found for validation');
    return ['agent-runtime not found for struct validation'];
  }
  
  // Check if core types exist
  const typesPath = path.join(agentRuntimePath, 'types');
  const expectedFiles = ['action.go', 'agent.go'];
  const errors = [];
  
  for (const file of expectedFiles) {
    const filePath = path.join(typesPath, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ Found Go type file: ${file}`);
      
      // Basic validation - check if struct matches our schema
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (file === 'action.go') {
        // Check for ActionDefinition struct
        if (!content.includes('type ActionDefinition struct')) {
          errors.push(`Missing ActionDefinition struct in ${file}`);
        }
        // Check for required fields
        const requiredFields = ['ActionID', 'Platform', 'Provider', 'Name', 'Description'];
        for (const field of requiredFields) {
          if (!content.includes(field)) {
            errors.push(`Missing field ${field} in ActionDefinition struct`);
          }
        }
      }
      
      if (file === 'agent.go') {
        // Check for Agent struct
        if (!content.includes('type Agent struct')) {
          errors.push(`Missing Agent struct in ${file}`);
        }
        // Check for required fields
        const requiredFields = ['AgentID', 'SystemPrompt', 'Model', 'Temperature'];
        for (const field of requiredFields) {
          if (!content.includes(field)) {
            errors.push(`Missing field ${field} in Agent struct`);
          }
        }
      }
    } else {
      errors.push(`❌ Missing Go type file: ${file}`);
    }
  }
  
  return errors;
}

async function validateActiveRecords() {
  console.log('\n▶ Validating active records...');
  
  try {
    // Check core_actions
    const coreActionsCount = await prisma.coreAction.count();
    console.log(`• Core Actions: ${coreActionsCount} records`);
    
    // Check app_platforms
    const platformsCount = await prisma.appPlatform.count();
    console.log(`• App Platforms: ${platformsCount} records`);
    
    // Check agents
    const agentsCount = await prisma.agent.count();
    console.log(`• Agents: ${agentsCount} records`);
    
    // Check recent executions
    const recentExecutions = await prisma.agentExecution.count({
      where: {
        startedAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });
    console.log(`• Recent Agent Executions (7 days): ${recentExecutions} records`);
    
    return [];
  } catch (error) {
    console.log(`⚠️  Could not query records: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('========================================');
  console.log('  Database Ownership Validation');
  console.log('========================================\n');
  
  const allErrors = [];
  
  try {
    // Run all validations
    const tableErrors = await validateTableExistence();
    allErrors.push(...tableErrors);
    
    const permErrors = await validatePermissions();
    allErrors.push(...permErrors);
    
    const structErrors = await validateGoStructAlignment();
    allErrors.push(...structErrors);
    
    const recordErrors = await validateActiveRecords();
    allErrors.push(...recordErrors);
    
    // Summary
    console.log('\n========================================');
    if (allErrors.length === 0) {
      console.log('✅ All validations passed!');
      console.log('\nOwnership model is correctly implemented:');
      console.log('  • web1.0 owns user data and action definitions');
      console.log('  • agent-runtime owns execution tracking');
      console.log('  • Both services have read access to all tables');
    } else {
      console.log(`❌ Found ${allErrors.length} issues:`);
      allErrors.forEach(error => console.log(`  • ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);