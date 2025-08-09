import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  User: a
    .model({
      userId: a.string().required(),
      email: a.string().required(),
      userName: a.string().required(),
      firstName: a.string(),
      lastName: a.string(),
      department: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update", "delete"]),
    ]),
  SavedQuery: a
    .model({
      title: a.string().required(),
      keyword: a.string(),
      filters: a.json(),
      lastResultCount: a.integer(),
      lastRunAt: a.string(),
      usageCount: a.integer().default(0),
      tags: a.string().array(),
      isPublic: a.boolean().default(true),
      createdBy: a.string(),
      description: a.string(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(["read", "create", "update"]),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
