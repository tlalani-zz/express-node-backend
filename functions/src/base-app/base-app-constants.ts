import { Grades } from "../constants/constants";


export const contains = (people: any[], name: string): number => {
    return people.findIndex((person: any) => person.Name === name);
}

export const addAbsents = (attendance: any, roster: any) => {
    Object.entries(roster).forEach(([role, people]: any) => {
      if(!attendance[role]) {
        attendance[role] = {};
      }
      Object.entries(people).forEach(([gradeOrPeople, peopleList]: any) => {
        if(!attendance[role][gradeOrPeople]) {
          attendance[role][gradeOrPeople] = [];
        }
          peopleList.forEach((personName: string) => {
            if(contains(attendance[role][gradeOrPeople], personName) === -1) {
              if(gradeOrPeople === "people")
                attendance[role][gradeOrPeople].push({Name: personName, Status: "A", Role: role});
              else
                attendance[role][gradeOrPeople].push({Role: role, Name: personName, Status: "A", Grade: gradeOrPeople});
            }
          });
      });
    });
};

export const parseAttendance = (val: any) => {
    const res: any = {};
    //{Student: {1st Grade: [], 2nd Grade: []} Management: {people: [Person]}
    Object.entries(val).forEach(([role, peopleOrGrade]: any) => {
      res[role] = {};
      if(Grades.Primary.includes(Object.keys(peopleOrGrade)[0])) {
        Object.entries(peopleOrGrade).forEach(([grade, people]: any) => {
          res[role][grade] = [];
          Object.entries(people).forEach(([personName, personFields]: any) => {
            const personObject : any= {Name: personName, Role: role};
            Object.entries(personFields).forEach(([fieldName, fieldValue]) => {
              personObject[fieldName] = fieldValue;
            });
            res[role][grade].push(personObject);
          })
        });
      } else {
        res[role]["people"]= [];
        Object.entries(peopleOrGrade).forEach(([personName, personFields]: any) => {
          const personObject: any = {Name: personName, Role: role};
          Object.entries(personFields).forEach(([fieldName, fieldValue]) => {
            personObject[fieldName] = fieldValue; 
          });
          res[role].people.push(personObject);
        })
      }
    });
    return res;
};

export const parseRoster = (val: any) => {
    const res: any = {};
    //{Student: {1st Grade: [], 2nd Grade: []} Management: {people: [Person]}
    Object.entries(val).forEach(([role, peopleOrGrade]: any) => {
      res[role] = {};
      if(Grades.Primary.includes(Object.keys(peopleOrGrade)[0])) {
        Object.entries(peopleOrGrade).forEach(([grade, people]: any) => {
          res[role][grade] = people;
        });
      } else {
        res[role]["people"]= peopleOrGrade;
      }
    });
    return res;
};