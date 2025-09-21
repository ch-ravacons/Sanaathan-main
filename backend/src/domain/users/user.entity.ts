export interface UserProps {
  id: string;
  email: string;
  fullName: string;
  spiritualName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  constructor(private readonly props: UserProps) {}

  get id() {
    return this.props.id;
  }

  get email() {
    return this.props.email;
  }

  get fullName() {
    return this.props.fullName;
  }

  get spiritualName() {
    return this.props.spiritualName ?? null;
  }

  toJSON() {
    return { ...this.props };
  }
}
