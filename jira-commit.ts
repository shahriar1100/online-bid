import { execSync } from "child_process";
import * as readline from "readline";

class JiraCommitTool {
  private rl: readline.Interface;
  private readonly jiraPattern = /^AUC-\d+$/;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private validateJiraTicket(ticket: string): boolean {
    return this.jiraPattern.test(ticket);
  }

  private async runCommitizen(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        execSync("git-cz", { stdio: "inherit" });

        // After commitizen completes, prepend JIRA ticket
        this.prependJiraToLastCommit();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private prependJiraToLastCommit(): void {
    try {
      const jiraTicket = process.env.JIRA_TICKET;
      if (!jiraTicket) return;

      // Get the last commit message
      const lastCommitMessage = execSync("git log -1 --pretty=%B", {
        encoding: "utf-8",
      }).trim();

      // Check if JIRA ticket is already in the message
      if (lastCommitMessage.includes(jiraTicket)) {
        console.log(
          `✅ JIRA ticket ${jiraTicket} already present in commit message`,
        );
        return;
      }

      // Prepend JIRA ticket to commit message with pipe separator
      const newCommitMessage = `${jiraTicket} | ${lastCommitMessage}`;

      // Amend the commit with the new message
      execSync(
        `git commit --amend -m "${newCommitMessage.replace(/"/g, '\\"')}"`,
        { stdio: "inherit" },
      );

      console.log(
        `✅ Your git commit says – ${newCommitMessage.replace(/"/g, '\\"')}`,
      );
    } catch (error) {
      console.error(
        "Failed to prepend JIRA ticket to commit:",
        (error as Error).message,
      );
    }
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.rl.question(
        "Enter JIRA ticket (AUC-XXX): ",
        async (ticket: string) => {
          try {
            if (!this.validateJiraTicket(ticket)) {
              console.error("❌ Invalid JIRA ticket format. Must be AUC-XXX");
              process.exit(1);
            }

            console.log(`✅ Using JIRA ticket: ${ticket}`);
            process.env.JIRA_TICKET = ticket;

            await this.runCommitizen();
            this.rl.close();
            resolve();
          } catch (error) {
            console.error("Commit failed:", (error as Error).message);
            this.rl.close();
            reject(error);
          }
        },
      );
    });
  }
}

// Execute if run directly
if (require.main === module) {
  const tool = new JiraCommitTool();
  tool.start().catch((error) => {
    console.error("Script failed:", error.message);
    process.exit(1);
  });
}

export { JiraCommitTool };
