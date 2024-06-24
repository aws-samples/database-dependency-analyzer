import { Grid, Box, SpaceBetween, Button } from "@cloudscape-design/components";
import DdaAppLayout from "../common/DdaAppLayout";
import styled from "styled-components";
import * as awsui from "@cloudscape-design/design-tokens";

const FeatureUnavailableText = styled.div`
  text-align: center;
  color: ${awsui.colorTextInteractiveDisabled};
`;

export default function Home() {
  return (
    <DdaAppLayout
      contentType="default"
      content={
        <main>
          <div>
            <Grid
              gridDefinition={[
                { colspan: { default: 12, xs: 8, s: 9 } },
                { colspan: { default: 12, xs: 4, s: 3 } },
              ]}
            >
              <div>
                <Box variant="h1">Database Dependency Analyzer</Box>
                <Box
                  variant="p"
                  color="text-body-secondary"
                  margin={{ top: "xxs", bottom: "s" }}
                >
                  Providing in-depth insights into your database object
                  dependencies with ease. Enhance your analysis of database
                  object dependencies through powerful visual tools.
                </Box>
              </div>

              <Box margin={{ top: "l" }}>
                <SpaceBetween size="s">
                  <Button
                    variant="primary"
                    fullWidth={true}
                    href="/database-objects"
                  >
                    Get started
                  </Button>
                  <div>
                    <Button disabled fullWidth={true}>
                      Try with sample data
                    </Button>
                    <FeatureUnavailableText>
                      Feature coming soon
                    </FeatureUnavailableText>
                  </div>
                </SpaceBetween>
              </Box>
            </Grid>
          </div>
        </main>
      }
    />
  );
}
