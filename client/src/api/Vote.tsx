import VoteOption from "./VoteOption";

class Vote {
    id: number
    title: string;
    multi_select:boolean
    group_id: number;

    constructor(id: number, title: string, multi_select: boolean=false, group_id: number) {
        this.id = id;
        this.title = title;
        this.multi_select = multi_select;
        this.group_id = group_id;
    }

    static async get_vote(id: number): Promise<Vote | null> {
        try {
            const response = await fetch(`/api/votes/${id}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const voteData = await response.json();
                return new Vote(voteData.id, voteData.title, voteData.multi_select, voteData.group_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching vote:', error);
            return null;
        }
    }

    static async get_votes(): Promise<Vote[] | null> {
        try {
            const response = await fetch('/api/votes', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const votesData = await response.json();
                return votesData.map((voteData: any) => new Vote(voteData.id, voteData.title, voteData.multi_select, voteData.group_id));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching votes:', error);
            return null;
        }
    }

    async delete(): Promise<boolean> {
        try {
            const response = await fetch(`/api/votes/${this.id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            console.error('Error deleting vote:', error);
            return false;
        }
    }

    async update(data: VoteUpdateData): Promise<boolean> {
        try {
            const response = await fetch(`/api/votes/${this.id}`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                const voteData = await response.json();
                this.title = voteData.title;
                this.multi_select = voteData.multi_select;
            }
            return response.ok
        } catch (error) {
            console.error('Error updating vote:', error);
            return false;
        }
    }

    async get_vote_options_for_vote(): Promise<VoteOption[] | null> {
        try {
            const response = await fetch(`/api/votes/${this.id}/vote_options`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const vote_optionsData = await response.json();
                return vote_optionsData.map((vote_optionData: any) => new VoteOption(vote_optionData.id, vote_optionData.title, vote_optionData.vote_id));
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching votes for group:', error);
            return null;
        }
    }

    async create_vote_options_for_vote(): Promise<VoteOption | null> {
        try {
            const response = await fetch(`/api/votes/${this.id}/vote_options`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const vote_optionData = await response.json();
                return new VoteOption(vote_optionData.id, vote_optionData.title, vote_optionData.vote_id);
            } else {
                return null;
            }
        } catch (error) {
            console.error('Error fetching votes for group:', error);
            return null;
        }
    }
}

type VoteUpdateData = {
    title?: string;
    multi_select?: boolean;
};

export default Vote;