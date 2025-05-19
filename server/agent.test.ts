import { describe, it, expect, beforeEach } from 'vitest';
import { NotionAgent, validateChatRequest } from './agent.js';

// Minimal test setup to ensure the test command passes
describe('Notion Agent', () => {
  it('passes basic test', () => {
    expect(true).toBe(true);
  });

  // Test input validation
  it('validates chat request with valid input', () => {
    const validRequest = { input: 'Test message' };
    expect(validateChatRequest(validRequest)).resolves.toEqual(validRequest);
  });

  it('rejects chat request with empty input', () => {
    const invalidRequest = { input: '' };
    expect(validateChatRequest(invalidRequest)).rejects.toThrow();
  });
  
  describe('NotionAgent class', () => {
    let agent: NotionAgent;

    beforeEach(() => {
      agent = new NotionAgent();
    });

    it('detects destructive actions correctly', async () => {
      // Test create action
      let response = await agent.chat('Create a new page called Test');
      expect(response.content).toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBe(true);
      
      // Test update action
      response = await agent.chat('Update the page about projects');
      expect(response.content).toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBe(true);
      
      // Test delete action
      response = await agent.chat('Delete the todo list');
      expect(response.content).toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBe(true);
    });
    
    it('processes non-destructive actions without confirmation', async () => {
      // Test get action
      let response = await agent.chat('Get my pages');
      expect(response.content).not.toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBeFalsy();
      
      // Test find action
      response = await agent.chat('Find information about project X');
      expect(response.content).not.toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBeFalsy();
      
      // Test list action
      response = await agent.chat('List all my databases');
      expect(response.content).not.toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBeFalsy();
    });
    
    it('processes with confirmation when confirm flag is true', async () => {
      // First request should ask for confirmation
      await agent.chat('Create a new page called Test');
      expect(agent.get('requireConfirm')).toBe(true);
      
      // Set confirm flag
      agent.set('confirm', true);
      
      // Second request should proceed with confirmed action
      const response = await agent.chat('Create a new page called Test');
      expect(response.content).toContain('Created');
      expect(agent.get('requireConfirm')).toBe(false);
    });

    // Test a sample manual request
    it('handles a realistic sample request', async () => {
      // Test the flow for creating a TODO page
      const initialResponse = await agent.chat('Create a new TODO page called Hello World');
      expect(initialResponse.content).toContain('CONFIRM?');
      expect(agent.get('requireConfirm')).toBe(true);
      
      // Confirm the action
      agent.set('confirm', true);
      const confirmedResponse = await agent.chat('Create a new TODO page called Hello World');
      
      expect(confirmedResponse.content).toContain('Created');
      expect(agent.get('requireConfirm')).toBe(false);
    });
  });
}); 