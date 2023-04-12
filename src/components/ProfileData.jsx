import React, { useState } from "react";

const applyForAccessPackage = async (accessPackageId, accessToken, accessPackage, questionAnswers) => {
  console.log("accessPackageId: ", accessPackageId);
  console.log("accessToken: ", accessToken);
  console.log("questionAnswers: ", questionAnswers); //todo this is not being passed properly

  // retrieve the current user's profile
  const profileUrl = 'https://graph.microsoft.com/v1.0/me';
  const profileResponse = await fetch(profileUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  const profileJson = await profileResponse.json();
  const profileId = profileJson.id;

  console.log("profileId: ", profileId);

  const accessPackageUrl = `https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/accessPackages/${accessPackageId}?$expand=assignmentPolicies`;

  const accessPackageResponse = await fetch(accessPackageUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
  const accessPackageJson = await accessPackageResponse.json();

  // find the assignment policy you want to use
  const assignmentPolicy = accessPackageJson.assignmentPolicies.find(policy => policy.displayName === 'Initial Policy');

  console.log(assignmentPolicy) 

  if (!assignmentPolicy) {
    console.error('Could not find assignment policy with display name "Initial Policy"');
    return;
  }

  const questionIds = assignmentPolicy.questions.map(question => question.id);

  const requestBody = {
    requestType: 'UserAdd',
    accessPackageAssignment: {
      assignmentPolicyId: assignmentPolicy.id,
      targetId: profileId,
      accessPackageId: accessPackage.id
    },
    answers: []
  };
  
  const questionAnswersString = JSON.stringify(questionAnswers);
  console.log(`On submit The answer given is: ${questionAnswersString}`) //todo: this is where the problem is
  
  questionIds.forEach(questionId => {
    const answer = {
      '@odata.type': '#microsoft.graph.accessPackageAnswerString',
      value: questionAnswers[questionId], //if this is replaced with "test" it works
      answeredQuestion: {
        '@odata.type': '#microsoft.graph.accessPackageTextInputQuestion',
        id: questionId
      }
    };
    requestBody.answers.push(answer);
  });
  
  
  console.log(requestBody);
  
  
  const requestUrl = 'https://graph.microsoft.com/beta/identityGovernance/entitlementManagement/accessPackageAssignmentRequests';
  
  const requestOptions = {
    method: 'POST',
    headers: new Headers({
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(requestBody)
  };
  
  

 
  console.log("assignmentPolicyId: ", assignmentPolicy.id);

  try {
    const response = await fetch(requestUrl, requestOptions);
    if (response.ok) {
      // handle success
    } else {
      // handle error
    }
  } catch (error) {
    // handle error
  }

  console.log(accessPackageJson);
};

export const ProfileData = (props) => {
  const { accessToken, graphData } = props;
  const [selectedAccessPackage, setSelectedAccessPackage] = useState(null);
  const [questionElements, setQuestionElements] = useState([]);
  const [questionAnswers, setQuestionAnswers] = useState({});


  const questionAnswersString = JSON.stringify(questionAnswers);

  console.log(`Answer string: ${questionAnswersString}`)


  const handleApplyClick = (accessPackage) => {
    applyForAccessPackage(accessPackage.id, accessToken, accessPackage, questionAnswers);
    console.log(accessPackage.id, accessPackage, questionAnswers);
  };  

  const handleQuestionSubmit = (questionId, answer) => {
    setQuestionAnswers(prevState => ({
      ...prevState,
      [questionId]: answer,
    }));
  };
  

  const findQuestions = async (accessPackage) => {
    console.log("button clicked");
    const accessPackageUrl = `https://graph.microsoft.com/v1.0/identityGovernance/entitlementManagement/accessPackages/${accessPackage.id}?$expand=assignmentPolicies`;

    const accessPackageResponse = await fetch(accessPackageUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const accessPackageJson = await accessPackageResponse.json();

    // find the assignment policy you want to use
    const policy = accessPackageJson.assignmentPolicies.find(policy => policy.displayName === 'Initial Policy');

    if (!policy) {
      console.error('Could not find assignment policy with display name "Initial Policy"');
      return;
    }

    // render the text and a text box for each question in the assignment policy
    const elements = policy.questions.map((question, index) => (
      <div key={question.id}>
        <p>{question.text}</p>
        <input
          type="text"
          onChange={(e) => handleQuestionSubmit(question.id, e.target.value)}
        />
        {index === policy.questions.length - 1 && (
          <button onClick={() => handleApplyClick(accessPackage)}>Apply</button>
        )}
      </div>
    ));
    
    setQuestionElements(elements);
    setSelectedAccessPackage(accessPackage);
  };

  //todo: set success/failiure messages

  const renderAccessPackage = (accessPackage) => {
    return (
      <div key={accessPackage.id}>
        <p>
          <strong>Access Package: </strong>
          {accessPackage.displayName}
        </p>
        <p>
          <strong>Access Package Description: </strong>
          {accessPackage.description}
        </p>
        <button onClick={() => findQuestions(accessPackage)}>I want to apply</button>
        {selectedAccessPackage === accessPackage ? questionElements : null}
      </div>
    );
  };

  return <div id="profile-div">{graphData.value.map((accessPackage) => renderAccessPackage(accessPackage))}</div>;
};





