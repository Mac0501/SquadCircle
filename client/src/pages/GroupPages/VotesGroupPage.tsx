import React, { useState } from 'react';
import Me from '../../api/Me';
import Group from '../../api/Group';
import { UserGroupPermissionEnum } from '../../utils/types';
import User from '../../api/User';
import { List } from 'antd';
import Vote from '../../api/Vote';
import VoteCard from '../../components/VoteCard';

interface VotesGroupPageProps {
    me: Me,
    group: Group,
    votes: Vote[];
    members: User[];
    mePermissions: UserGroupPermissionEnum[];
}

const VotesGroupPage: React.FC<VotesGroupPageProps> = ({ me, group, votes, members, mePermissions }) =>  {
    const [votesList, setVotesList] = useState<Vote[]>(votes);

    const handleDeleteVote = async (deletedVote: Vote) => {
        const updatedVotesList = votesList.filter(vote => vote.id !== deletedVote.id);
        setVotesList(updatedVotesList);
    };

    return (
        <List
            grid={{
                gutter: 16,
                xs: 1,
                sm: 2,
                md: 2,
                lg: 2,
                xl: 3,
                xxl: 3,
            }}
            dataSource={votesList}
            renderItem={(vote: Vote) => (
                <List.Item>
                    <VoteCard me={me} vote={vote} mePermissions={mePermissions} group={group} members={members} onDelete={handleDeleteVote}/>
                </List.Item>
            )}
        />
    );
};

export default VotesGroupPage;
