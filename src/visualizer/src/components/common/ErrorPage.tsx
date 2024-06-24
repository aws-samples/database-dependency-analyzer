import { Box } from "@cloudscape-design/components";
import DdaAppLayout from "./DdaAppLayout";
import { Link } from "react-router-dom";

export default function ErrorPage() {
  return (
    <DdaAppLayout
      contentType="default"
      content={
        <main>
          <div>
            <Box variant="h1">Page not found</Box>
            <Box
              variant="p"
              color="text-body-secondary"
              margin={{ top: "xxs", bottom: "s" }}
            >
              The link you followed may be broken, or the page may have been
              removed. <Link to={"/"}>Go back to home</Link>
            </Box>
          </div>
        </main>
      }
    />
  );
}
