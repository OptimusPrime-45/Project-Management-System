import React, { useEffect } from "react";
import MemberList from "../../components/Project/MemberList";

const ProjectMembers = ({
  projectId,
  members,
  membersLoading,
  memberError,
  canManage,
  canManageAdmins,
  fetchMembers,
  onAdd,
  onRoleChange,
  onRemove,
  onLeave,
}) => {
  useEffect(() => {
    if (projectId) {
      fetchMembers(projectId);
    }
  }, [projectId, fetchMembers]);

  if (membersLoading && members.length === 0) {
    return <p className="text-muted-foreground">Loading members…</p>;
  }

  if (memberError) {
    return (
      <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">
        {memberError}
      </div>
    );
  }

  return (
    <MemberList
      projectId={projectId}
      members={members}
      canManage={canManage}
      canManageAdmins={canManageAdmins}
      onAddMember={(payload) => onAdd(projectId, payload)}
      onRoleChange={({ userId, role }) =>
        onRoleChange({ projectId, userId, role })
      }
      onRemoveMember={(member) => onRemove(projectId, member.userId || member.user?._id || member._id)}
      onLeaveProject={onLeave ? () => onLeave(projectId) : null}
      isProcessing={membersLoading}
    />
  );
};

export default ProjectMembers;
