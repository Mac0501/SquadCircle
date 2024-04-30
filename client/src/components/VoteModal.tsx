import { Button, Input, List, Modal, Switch, Typography } from "antd";
import { useEffect, useState } from "react";
import Vote from "../api/Vote";
import VoteOption from "../api/VoteOption";
import VoteOptionCard from "./VoteOptionCard";
import Me from "../api/Me";
import { UserGroupPermissionEnum } from "../utils/types";
import Group from "../api/Group";
import UserVoteOptionResponse from "../api/UserVoteOptionResponse";
import User from "../api/User";

interface VoteModalProps {
    me: Me,
    mePermissions: UserGroupPermissionEnum[],
    visible: boolean;
    onFinish: (values: Vote) => void;
    onDelete: () => void;
    onCancel: () => void;
    vote?: Vote;
    group: Group;
    members: User[];
}

interface VoteProps {
    id: number|null;
    title: string|null;
    multi_select: boolean;
    group_id: number|null;
    vote_options: VoteOptionProp[];
    updated_vote_options: number[];
    remove_vote_options: number[];
}

interface VoteOptionProp {
    id: number|null
    title: string;
    vote_id: number | null;
    user_vote_option_responses: UserVoteOptionResponse[] | null;
}

const VoteModal: React.FC<VoteModalProps> = ({ me, mePermissions, visible, onFinish, onDelete, onCancel, vote, group, members }) => {
    const [deleteConfirmVisibleVote, setDeleteConfirmVisibleVote] = useState<boolean>(false);
    const [createModalVisibleVoteOption, setCreateModalVisibleVoteOption] = useState<boolean>(false);
    const [editVote, setEditVote] = useState<VoteProps>({ id: null, title: null, multi_select: false, group_id: null, vote_options: [], updated_vote_options: [], remove_vote_options: []});
    const [createVoteOption, setCreateVoteOption] = useState<VoteOptionProp>({ id: null, title: '', vote_id:vote ? vote.id : null, user_vote_option_responses:[]});
    const [changed, setChanged] = useState<boolean>(vote === undefined);
    const allowedToEdit = (me.owner || mePermissions.includes(UserGroupPermissionEnum.ADMIN) || mePermissions.includes(UserGroupPermissionEnum.MANAGE_VOTES));

    useEffect(() => {
        if (vote) {
            setEditVote({
                id: vote.id,
                title: vote.title,
                multi_select: vote.multi_select,
                group_id: vote.group_id,
                vote_options: vote.vote_options ? vote.vote_options : [],
                updated_vote_options: [],
                remove_vote_options: []
            });
        }
        else{
            setEditVote({ id: null,
                title: null,
                multi_select: false,
                group_id: null,
                vote_options: [],
                updated_vote_options: [],
                remove_vote_options: []
            });
        }
    }, [vote]);

    const customeSetEditVote = () => {
        if (vote) {
            setEditVote({
                id: vote.id,
                title: vote.title,
                multi_select: vote.multi_select,
                group_id: vote.group_id,
                vote_options: vote.vote_options ? vote.vote_options : [],
                updated_vote_options: [],
                remove_vote_options: []
            });
        }
        else{
            setEditVote({ id: null,
                title: null,
                multi_select: false,
                group_id: null,
                vote_options: [],
                updated_vote_options: [],
                remove_vote_options: []
            });
        }
    }

    const handleFinish = async() => {
        let newVote: Vote | null;
        if(editVote.title !== null){
            if(vote===undefined){
                newVote = await group.create_vote_for_group(editVote.title, editVote.multi_select)
            }
            else{
                await vote.update({
                    title: editVote.title,
                });
                newVote = new Vote(
                    vote.id,
                    vote.title,
                    vote.multi_select,
                    vote.group_id,
                    []
                );
            }
            newVote!.vote_options = []
            if (newVote !== null){
                for (const vote_option of editVote.vote_options) {
                    let newVoteOption: VoteOption | null;
                    if (vote_option.id === null) {
                        newVoteOption = await newVote!.create_vote_options_for_vote(vote_option.title!)
                    } else {
                        newVoteOption = new VoteOption(vote_option.id, vote_option.title!, vote_option.vote_id? vote_option.vote_id : newVote.id, vote_option.user_vote_option_responses)
                        if (newVoteOption) {
                            newVote!.vote_options?.push(newVoteOption);
                        }
                    }
                }
                for (const remove_vote_option_id of editVote.remove_vote_options) {
                    const removeVoteOption = vote!.vote_options?.find(option => option.id === remove_vote_option_id);
                    newVote.vote_options = newVote.vote_options!.filter(option => option.id !== remove_vote_option_id);
                    if (removeVoteOption) {
                        await removeVoteOption.delete();
                    }
                }

                for (const updated_vote_option_id of editVote.updated_vote_options) {
                    const updatedVoteOption = newVote.vote_options?.find(option => option.id === updated_vote_option_id);
                    if(updatedVoteOption){
                        await updatedVoteOption.update(updatedVoteOption.title)
                    }

                }
                onFinish(newVote);
                if(!vote){
                    customeSetEditVote()
                }
            }  
        }
    };

    const handleCancel = () =>{
        onCancel()
        customeSetEditVote()
        setCreateVoteOption({ id: null, title: '', vote_id:vote ? vote.id : null, user_vote_option_responses:[]})

    }

    const handleCreateVoteOption = () => {
        setChanged(true);
        const updatedVoteOptions = [...editVote.vote_options];
    
        // Add the new vote option to the copied array
        updatedVoteOptions.push(createVoteOption);
        
        // Update the editVote state with the new vote options array
        setEditVote({
            ...editVote,
            vote_options: updatedVoteOptions
        });

        setCreateVoteOption({ id: null, title: '', vote_id:vote ? vote.id : null, user_vote_option_responses:[]})
    };

    const handleDeleteVoteOption = (deletedVoteOption:VoteOptionProp, index: number) => {
        setChanged(true);
        if(deletedVoteOption.id !== null){
            const filteredVoteOptions = editVote.vote_options.filter(option => option.id !== deletedVoteOption.id);
            setEditVote({
                ...editVote,
                vote_options: filteredVoteOptions,
                remove_vote_options: [...editVote.remove_vote_options, deletedVoteOption.id],
                updated_vote_options: editVote.updated_vote_options.filter(id => id !== deletedVoteOption.id)
            });
        }
        else{
            const filteredVoteOptions = editVote.vote_options.filter((option, idx) =>
                idx !== index
            );
            setEditVote({
                ...editVote,
                vote_options: filteredVoteOptions
            });
        }
    };

    const handleUpdateVoteOption = (updatedVoteOption: VoteOptionProp, index: number) => {
        setChanged(true);
        if (updatedVoteOption.id !== null) {
            const updatedVoteOptions = editVote.vote_options.map(option =>
                option.id === updatedVoteOption.id ? updatedVoteOption : option
            );
            setEditVote({
                ...editVote,
                vote_options: updatedVoteOptions,
                updated_vote_options: Array.from(new Set([...editVote.updated_vote_options, updatedVoteOption.id]))
            });
        } else {
            const updatedVoteOptions = [...editVote.vote_options];
            updatedVoteOptions[index] = updatedVoteOption;
            setEditVote({
                ...editVote,
                vote_options: updatedVoteOptions
            });
        }
    };

    const handleCheckVoteOption = (userVoteOptionResponse: UserVoteOptionResponse|null) => {
        if (vote?.multi_select === false && userVoteOptionResponse !== null){
            for (const vo of editVote.vote_options) {
                if(vo.id !== userVoteOptionResponse.vote_option_id){
                    const remove__user_vote_option_response_vo = vo.user_vote_option_responses?.filter(response =>response.user_and_group?.user_id === me.id)
                    if (remove__user_vote_option_response_vo !== undefined){
                        remove__user_vote_option_response_vo.forEach(async (remove_response)=>{
                            await remove_response.delete();
                        })
                    }
                    const new__user_vote_option_response_vo = vo.user_vote_option_responses?.filter(response =>response.user_and_group?.user_id !== me.id)
                    vo.user_vote_option_responses = new__user_vote_option_response_vo ? new__user_vote_option_response_vo : [];
                }
            }
            setEditVote({ ...editVote });
        }
    };
    
    return (
        <div>
            <Modal
                title="Vote"
                width="900px"
                open={visible}
                onCancel={handleCancel}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                            {(allowedToEdit && vote) && (
                                <Button danger onClick={()=>{setDeleteConfirmVisibleVote(true)}} type="primary">
                                    Delete
                                </Button>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {changed ? (
                                <div>
                                    <Button onClick={handleCancel} key="back" style={{marginRight:'5px'}}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" onClick={handleFinish} key="submit" disabled={(editVote.title === null || editVote.title?.length === 0 || editVote.vote_options?.length === 0)}>
                                        Save
                                    </Button>
                                </div>
                            ) : (
                                <Button type="primary" onClick={handleCancel} key="submit">
                                    Close
                                </Button>
                            )}
                        </div>
                    </div>
                }
            >
                <div style={{marginTop:'24px', marginBottom:'12px'}}>
                    <Typography.Title
                        level={3}
                        style={{margin:'0px'}}
                        { ...(allowedToEdit ? { editable: { 
                                                onChange: (title:string) => {
                                                    setChanged(true);
                                                    setEditVote({ ...editVote, title: title })
                                                },
                                                enterIcon: null,
                                                maxLength:100,
                                            } } : {}) }
                    >
                        {editVote ? editVote.title : ''}
                    </Typography.Title>
                </div>
                <div style={{display:'flex', alignItems:'center', marginBottom: '10px', marginTop: '5px'}}>
                    {vote ? (
                        vote.multi_select ? "Select atleast one option." : "Select one option."
                    ) : ""}
                </div>
                {(allowedToEdit && !vote) && (
                                <div style={{display:'flex', alignItems:'center', marginBottom: '10px', marginTop: '5px'}}>
                                    <span>multiple choice:</span>
                                    <Switch value={editVote.multi_select} onChange={(checked:boolean)=>{setEditVote({...editVote, multi_select:checked})}} />
                                </div>
                            )}
                {allowedToEdit && (
                    <Button onClick={()=>{
                            setCreateVoteOption({ id: null, title: '', vote_id:vote ? vote.id : null, user_vote_option_responses:[]})
                            setCreateModalVisibleVoteOption(true);
                        }} 
                        type="primary" 
                        style={{marginBottom:'5px'}}
                    >
                        Add Vote-Option
                    </Button>
                )}
                <div style={{ maxHeight: '300px', overflowY: 'scroll', overflowX: 'clip', padding: '5px' }}>
                    <List
                        grid={{
                            gutter: 16,
                            xs: 1,
                            sm: 1,
                            md: 1,
                            lg: 1,
                            xl: 1,
                            xxl: 1,
                        }}
                        dataSource={editVote ? editVote.vote_options ? editVote.vote_options : [] : []}
                        renderItem={(vote_option: VoteOptionProp, index: number) => (
                            <List.Item>
                                <VoteOptionCard
                                    key={index} 
                                    me={me}
                                    onCheck={(userVoteOptionResponse: UserVoteOptionResponse|null)=>{handleCheckVoteOption(userVoteOptionResponse)}}
                                    onEdit={(editedVoteOption:VoteOptionProp)=>{handleUpdateVoteOption(editedVoteOption, index)}}
                                    onDelete={(deletedVoteOption:VoteOptionProp)=>{handleDeleteVoteOption(deletedVoteOption, index)}}
                                    vote_option={vote_option}
                                    mePermissions={mePermissions}
                                    { ...(allowedToEdit ? { editable: true } : {})}
                                    members={members}/>
                            </List.Item>
                        )}
                    />
                </div>
            </Modal>
            <Modal
                title="Create Vote-Option"
                open={createModalVisibleVoteOption}
                onOk={() => { 
                    handleCreateVoteOption();
                    setCreateModalVisibleVoteOption(false);
                }}
                onCancel={()=>{setCreateModalVisibleVoteOption(false);}}
                okButtonProps={{ disabled: !(createVoteOption.title?.length > 0 && createVoteOption.title?.length <= 100) }}
            >
                <Input 
                    maxLength={100} 
                    value={createVoteOption.title ? createVoteOption.title : ''} 
                    onChange={(e) => {
                        setCreateVoteOption({ ...createVoteOption, title: e.target.value });
                    }}
                />
            </Modal>
            <Modal
                title="Confirm Delete"
                open={deleteConfirmVisibleVote}
                onOk={()=>{onDelete(); setDeleteConfirmVisibleVote(false)}}
                onCancel={()=>{setDeleteConfirmVisibleVote(false)}}
            >
                Are you sure you want to delete this vote?
            </Modal>
        </div>
    );
};

export default VoteModal;
