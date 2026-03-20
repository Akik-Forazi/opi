// lib/types.ts — shared types across OPI

export interface UserRecord {
  username:    string
  email:       string
  password:    string  // bcrypt hash
  display_name?: string
  bio?:        string
  website?:    string
  joined_at:   string  // ISO
  api_tokens:  string[]  // list of token prefixes for display
  packages:    string[]  // list of package names owned
  is_verified: boolean
}

export interface PackageMeta {
  name:         string
  owner:        string  // username
  description:  string
  latest:       string  // latest version string
  license:      string
  homepage?:    string
  repository?:  string
  keywords:     string[]
  classifiers?: string[]
  created_at:   string  // ISO
  updated_at:   string  // ISO
  total_downloads: number
}

export interface PackageVersion {
  name:         string
  version:      string
  description:  string
  author:       string
  author_email?: string
  license:      string
  homepage?:    string
  repository?:  string
  keywords:     string[]
  classifiers?: string[]
  requires_omnikarai?: string  // e.g. ">=5.0"
  dependencies: Record<string, string>  // { math: ">=1.0" }
  dev_dependencies?: Record<string, string>
  published_at: string  // ISO
  published_by: string  // username
  yanked:       boolean
  yank_reason?: string
  readme?:      string  // markdown content
  changelog?:   string
  file_size?:   number  // bytes
  file_hash?:   string  // SHA-256
}

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}
