import {z} from 'zod'

const configSchema = z.object({
  auth: z.object({
    username: z.string(),
    password: z.string(),
  }),
  project: z.object({
    workspace: z.string(),
    repository: z.string(),
  }),
})

class Bitbucket {
  private username: string
  private password: string
  private workspace: string
  private repository: string
  private baseUrl: string

  private bitbucketApiUrl = 'https://api.bitbucket.org/2.0'

  constructor(config: {
    auth: {username: string; password: string}
    project: {workspace: string; repository: string}
  }) {
    const {auth, project} = configSchema.parse(config)

    this.username = auth.username
    this.password = auth.password
    this.workspace = project.workspace
    this.repository = project.repository
    this.baseUrl = `${this.bitbucketApiUrl}/repositories/${this.workspace}/${this.repository}`
  }

  async addCommentToPullRequest(prId: number, comment: string) {
    return this.post(`/pullrequests/${prId}/comments`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: {
        content: {
          raw: comment,
          // markup: 'markdown',
        },
      },
    })
  }

  async get<TResponse>(url: string, options: RequestInit = {}) {
    return this.fetchWithAuth<TResponse>(`${this.baseUrl}${url}`, options)
  }

  async post<TResponse>(
    url: string,
    options: Omit<RequestInit, 'body'> & {body?: any} = {},
  ) {
    return this.fetchWithAuth<TResponse>(`${this.baseUrl}${url}`, {
      ...options,
      method: 'POST',
      body: JSON.stringify(options.body),
    })
  }

  async fetchWithAuth<TResponse>(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Accept: 'application/json',
        Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
      },
    })

    if (!response.ok) {
      const body = await response.text()

      throw new Error(
        `Failed to fetch ${url}: ${response.status} ${response.statusText}\n${body}`,
      )
    }

    return (await response.json()) as TResponse
  }
}

export const bitbucket = new Bitbucket({
  auth: {
    username: Bun.env.BITBUCKET_USERNAME!,
    password: Bun.env.BITBUCKET_APP_PASSWORD!,
  },
  project: {
    workspace: Bun.env.BITBUCKET_WORKSPACE!,
    repository: Bun.env.BITBUCKET_REPOSITORY!,
  },
})
