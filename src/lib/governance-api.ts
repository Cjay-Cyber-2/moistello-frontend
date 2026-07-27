import { get, post } from "@/lib/api-client"

export type ProposalStatus = "active" | "passed" | "defeated"

export interface GovernanceProposal {
  id: string
  title: string
  description: string
  status: ProposalStatus
  votesFor: number
  votesAgainst: number
  timelockEndsAt: string | null
}

export async function listProposals(status: ProposalStatus) {
  const result = await get<{ proposals?: GovernanceProposal[] } | GovernanceProposal[]>(
    `/governance/proposals?status=${status}`,
  )
  return Array.isArray(result) ? result : result.proposals ?? []
}

export async function getProposal(id: string) {
  const result = await get<{ proposal?: GovernanceProposal } | GovernanceProposal>(
    `/governance/proposals/${id}`,
  )
  return "proposal" in result && result.proposal
    ? result.proposal
    : (result as GovernanceProposal)
}

export function createProposal(input: {
  title: string
  description: string
  executionPayload: string
}) {
  return post<GovernanceProposal>("/governance/proposals", input)
}

export function voteOnProposal(id: string, support: boolean) {
  return post(`/governance/proposals/${id}/votes`, { support })
}
