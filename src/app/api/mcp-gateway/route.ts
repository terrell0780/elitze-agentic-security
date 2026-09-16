Here is the full updated section from [`src/app/api/mcp-gateway/route.ts`](https://github.com/terrell0780/elitze-agentic-security/commit/10262f8fc7a746f6cf166490c8d3473288dfb473#diff-9be984492d8c56c9d8b8a2bfd38f300dbe44884c53aa48058bdb9ba44bc39da6L75) incorporating the safe optional chaining and type improvements so you can copy and paste it directly into your file:

```typescript
    const rawClassification = typeof body?.params?.dataClassification === "string" 
      ? body.params.dataClassification.toUpperCase() 
      : "";

    const validClassifications = ["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"] as const;
    type DataClassification = typeof validClassifications[number];

    const classification: DataClassification | undefined = 
      /secret|credential|password|token|private/i.test(toolName) ? "RESTRICTED" :
      /slack|message|send/i.test(toolName) ? "CONFIDENTIAL" :
      validClassifications.includes(rawClassification as DataClassification) ? (rawClassification as DataClassification) :
      undefined;

    const resource = typeof body?.params?.resource === "string" 
      ? body.params.resource 
      : (chain.resource_id ? String(chain.resource_id) : undefined);
      
    const environment = typeof body?.params?.environment === "string" 
      ? body.params.environment 
      : undefined;
      
    const purpose = typeof body?.params?.purpose === "string" 
      ? body.params.purpose 
      : String(chain.purpose);
      
    const impactLevel = typeof body?.params?.impactLevel === "string" 
      ? body.params.impactLevel 
      : undefined;

    const policiesResult = await client.query(
      `SELECT id, name, version, definition FROM security_policies WHERE tenant_id = $1 AND active = true AND (expires_at IS NULL OR expires_at > now()) ORDER BY priority DESC`,
      [chain.tenant_id]
    );
    const policies = policiesResult.rows.map((row: any) => ({
      ...(row.definition as PolicyDocument),
      id: String(row.id),
      name: String(row.name),
      version: String(row.version),
      active: true
    }));

    const policyMatch = evaluatePolicies(policies, {
      agentIdentityId: String(chain.agent_identity_id),
      agentName: String(chain.agent_name),
      humanOwnerId: String(chain.human_owner_id),
      tool: toolName,
      action: toolName,
      dataClassification: classification,
      resource,
      environment,
      purpose,
      impactLevel: impactLevel as any
    });

    const fallback = evaluateMcpCall({
      tenantId: String(chain.tenant_id),
      agentIdentityId: String(chain.agent_identity_id),
      gatewayServerId: String(server.id),
      toolName,
      action: toolName,
      dataClassification: classification,
      requestedCapability: String(chain.requested_capability),
      resource,
      environment,
      purpose,
      arguments: body?.params?.arguments,
      requestId
    });

```
